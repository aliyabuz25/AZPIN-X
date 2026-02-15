import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import pool, { initDB } from './db.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const JWT_SECRET = process.env.JWT_SECRET || 'azpin-super-secret-key'
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const DIST_DIR = path.join(__dirname, '..', 'dist')

app.use(cors({ origin: '*' }))
app.use('/uploads', express.static(UPLOAD_DIR))
app.use(express.static(DIST_DIR))

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})

app.use(express.json())

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) return res.sendStatus(401)

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        const id = uuidv4()

        await pool.query(
            'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
            [id, email, hashedPassword]
        )

        await pool.query(
            'INSERT INTO profiles (user_id, first_name, last_name, phone, avatar_url) VALUES (?, ?, ?, ?, ?)',
            [id, '', '', '', '']
        )

        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' })
        res.json({ token, user: { id, email } })
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' })
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
        const user = rows[0]

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
        res.json({ token, user: { id: user.id, email: user.email } })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT u.id, u.email, p.first_name, p.last_name, p.phone, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?',
            [req.user.id]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
        res.json({ user: rows[0] })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.post('/api/profile/update', authenticateToken, async (req, res) => {
    const { first_name, last_name, phone, avatar_url } = req.body
    try {
        await pool.query(
            'UPDATE profiles SET first_name = ?, last_name = ?, phone = ?, avatar_url = ? WHERE user_id = ?',
            [first_name, last_name, phone, avatar_url, req.user.id]
        )
        res.json({ ok: true })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// File Upload
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
        cb(null, name)
    }
})

const upload = multer({ storage })

app.post('/api/upload', upload.fields([{ name: 'avatar' }, { name: 'receipt' }, { name: 'file' }]), (req, res) => {
    const file = req.files?.avatar?.[0] || req.files?.receipt?.[0] || req.files?.file?.[0]
    if (!file) return res.status(400).json({ error: 'no_file' })
    const url = `/uploads/${file.filename}`
    res.json({ url })
})

// Orders
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { total, items } = req.body
    const orderId = uuidv4()

    try {
        await pool.query(
            'INSERT INTO orders (id, user_id, total, status) VALUES (?, ?, ?, ?)',
            [orderId, req.user.id, total, 'pending_payment']
        )

        for (const item of items) {
            await pool.query(
                'INSERT INTO order_items (order_id, product_id, name, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?)',
                [orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
            )
        }

        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId])
        res.json({ ok: true, order: orders[0] })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        )

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id])
            return { ...order, order_items: items }
        }))

        res.json({ orders: ordersWithItems })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
    const { receipt_url, status } = req.body
    try {
        await pool.query(
            'UPDATE orders SET receipt_url = ?, status = ? WHERE id = ? AND user_id = ?',
            [receipt_url, status, req.params.id, req.user.id]
        )
        res.json({ ok: true })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// Admin Data
app.get('/api/admin/data', async (req, res) => {
    let token = req.headers['x-admin-key']
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ')
        if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1]
    }

    if (token !== 'admin123') return res.status(403).json({ error: 'Unauthorized' })

    try {
        const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
        const [items] = await pool.query('SELECT * FROM order_items')
        const [profiles] = await pool.query('SELECT * FROM profiles')
        const [users] = await pool.query('SELECT id, email, created_at FROM users')
        const [wallets] = await pool.query('SELECT * FROM reseller_wallets')
        const [apis] = await pool.query('SELECT * FROM reseller_api_keys')

        res.json({
            orders,
            items,
            profiles,
            users,
            wallets,
            apis
        })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

// OTP
const OTP_TTL_MS = 5 * 60 * 1000
const otpStore = new Map()
const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

app.post('/api/otp/send', async (req, res) => {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'phone_required' })

    const otp = genOtp()
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS })

    const apiKey = process.env.HUBMSG_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'missing_api_key' })

    try {
        const r = await fetch('https://hubmsgpanel.octotech.az/api/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ recipient: phone, message: `Təsdiq kodunuz: ${otp}` })
        })
        if (!r.ok) return res.status(500).json({ error: 'hubmsg_failed' })
        res.json({ ok: true })
    } catch (e) {
        res.status(500).json({ error: 'hubmsg_failed' })
    }
})

app.post('/api/otp/verify', (req, res) => {
    const { phone, code } = req.body
    const entry = otpStore.get(phone)
    if (!entry || Date.now() > entry.expiresAt || entry.otp !== String(code)) {
        return res.status(400).json({ error: 'invalid_otp' })
    }
    otpStore.delete(phone)
    res.json({ ok: true })
})

// Products Proxy
app.get('/api/products', async (_req, res) => {
    const LISANS_URL = 'https://bayi.lisansofisi.com/api/products?limit=300'
    const LISANS_KEY = 'ak_803b789e6aed8a50f21fb6b6a9bddaa5_1769965145'

    try {
        const r = await fetch(LISANS_URL, { headers: { 'X-API-Key': LISANS_KEY } })
        const data = await r.json()
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products' })
    }
})

// Serving
app.get('/d-admin', (req, res) => res.sendFile(path.join(DIST_DIR, 'pin-admin.html')))
app.get(/.*/, (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))

const start = async () => {
    try {
        await initDB()
        const PORT = process.env.PORT || 5174
        app.listen(PORT, () => console.log(`Server running on ${PORT}`))
    } catch (err) {
        console.error('Failed to start server:', err)
        process.exit(1)
    }
}

start()

