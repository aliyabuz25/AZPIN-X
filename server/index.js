import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads')

const DIST_DIR = path.join(__dirname, '..', 'dist')

app.use(cors({ origin: '*' }))
app.use('/uploads', express.static(UPLOAD_DIR))
app.use(express.static(DIST_DIR))

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})

app.use(express.json())

const SUPABASE_URL = 'https://qmrchngwatxrnnkklfwa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const adminClient = SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null

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

const OTP_TTL_MS = 5 * 60 * 1000
const otpStore = new Map()

const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

app.post('/api/otp/send', async (req, res) => {
    const { phone } = req.body || {}
    if (!phone) return res.status(400).json({ error: 'phone_required' })

    const otp = genOtp()
    const expiresAt = Date.now() + OTP_TTL_MS
    otpStore.set(phone, { otp, expiresAt })

    const apiKey = process.env.HUBMSG_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'missing_api_key' })

    const payload = {
        recipient: phone,
        message: `Təsdiq kodunuz: ${otp}`
    }

    try {
        const r = await fetch('https://hubmsgpanel.octotech.az/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
        })
        if (!r.ok) {
            const text = await r.text()
            return res.status(500).json({ error: 'hubmsg_failed', details: text })
        }
        return res.json({ ok: true })
    } catch (e) {
        return res.status(500).json({ error: 'hubmsg_failed' })
    }
})

app.post('/api/otp/verify', (req, res) => {
    const { phone, code } = req.body || {}
    if (!phone || !code) return res.status(400).json({ error: 'invalid' })
    const entry = otpStore.get(phone)
    if (!entry) return res.status(400).json({ error: 'otp_not_found' })
    if (Date.now() > entry.expiresAt) {
        otpStore.delete(phone)
        return res.status(400).json({ error: 'otp_expired' })
    }
    if (entry.otp !== String(code)) return res.status(400).json({ error: 'otp_invalid' })
    otpStore.delete(phone)
    return res.json({ ok: true })
})

app.post('/api/notify-order', async (req, res) => {
    const { adminPhone, customerPhone, message } = req.body || {}
    const apiKey = process.env.HUBMSG_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'missing_api_key' })

    const sendMessage = async (recipient) => {
        const r = await fetch('https://hubmsgpanel.octotech.az/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({ recipient, message })
        })
        return r.ok
    }

    try {
        const results = {}
        if (adminPhone) results.admin = await sendMessage(adminPhone)
        if (customerPhone) results.customer = await sendMessage(customerPhone)
        return res.json({ ok: true, results })
    } catch (_e) {
        return res.status(500).json({ error: 'hubmsg_failed' })
    }
})

app.get('/api/admin/users', async (_req, res) => {
    if (!adminClient) return res.status(500).json({ error: 'missing_service_role' })
    try {
        const { data, error } = await adminClient.auth.admin.listUsers()
        if (error) return res.status(500).json({ error: error.message })
        return res.json({ users: data?.users || [] })
    } catch (_e) {
        return res.status(500).json({ error: 'admin_users_failed' })
    }
})

// LISANS OFISI PROXY
app.get('/api/products', async (_req, res) => {
    const LISANS_URL = 'https://bayi.lisansofisi.com/api/products?limit=300'
    const LISANS_KEY = 'ak_803b789e6aed8a50f21fb6b6a9bddaa5_1769965145'

    try {
        const r = await fetch(LISANS_URL, {
            headers: { 'X-API-Key': LISANS_KEY }
        })
        const data = await r.json()
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch external products' })
    }
})

// Serve React App
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
})

const PORT = process.env.PORT || 5174
app.listen(PORT, () => {
    console.log(`Upload server running on ${PORT}`)
})
