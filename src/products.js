import './style.css'
import { gsap } from 'gsap'
import { initTransitions } from './transitions'
import { initSnow } from './snow'
import { initCart, CartManager } from './cart'
import { supabase } from './supabase'

const CONFIG = {
    API_URL: '/api' // Use local proxy
}

let db = []
let currentPage = 1
let selectedBrand = 'all'

const getElements = () => ({
    themeBtn: document.getElementById('thm-btn'),
    out: document.getElementById('out'),
    loader: document.getElementById('loader'),
    pagination: document.getElementById('pagination'),
    find: document.getElementById('side-search'),
    topSearch: document.getElementById('top-search'),
    filterBtn: document.getElementById('filter-btn'),
    sortOptions: document.getElementsByName('sort'),
    brandList: document.getElementById('brand-list')
})

async function start() {
    const el = getElements()
    try {
        const r = await fetch(`${CONFIG.API_URL}/products`)
        const d = await r.json()
        db = d.data?.products || []

        if (el.loader) el.loader.style.display = 'none'
        buildBrands()
        draw(1)
    } catch (e) {
        if (el.loader) el.loader.innerText = 'Xəta: Məhsullar yüklənə bilmədi.'
    }
}

function draw(page = 1) {
    const el = getElements()
    if (!el.out) return

    currentPage = page
    const qValue = el.find?.value?.toLowerCase() || el.topSearch?.value?.toLowerCase() || ''

    const limit = 20
    let filtered = [...db].filter(p => {
        const okQ = p.name.toLowerCase().includes(qValue)
        const okB = selectedBrand === 'all' || p.category_name === selectedBrand
        return okQ && okB
    })

    filtered.sort((a, b) => {
        const aStock = a.in_stock === true || parseInt(a.stock) > 0
        const bStock = b.in_stock === true || parseInt(b.stock) > 0

        // Push out-of-stock to the end
        if (aStock && !bStock) return -1
        if (!aStock && bStock) return 1

        // Secondary sort from user options
        const sortVal = [...el.sortOptions].find(r => r.checked)?.value
        if (sortVal === 'az') return a.name.localeCompare(b.name)
        if (sortVal === 'high') return parseFloat(b.price) - parseFloat(a.price)
        if (sortVal === 'low') return parseFloat(a.price) - parseFloat(b.price)
        return 0
    })

    const total = filtered.length
    const pages = Math.ceil(total / limit)
    const items = filtered.slice((currentPage - 1) * limit, currentPage * limit)

    el.out.innerHTML = ''

    items.forEach((p, i) => {
        const hasStock = p.in_stock === true || parseInt(p.stock) > 0
        const price = parseFloat(p.price).toLocaleString('az-AZ', { minimumFractionDigits: 2 })
        const oldPrice = (parseFloat(p.price) * 1.05).toLocaleString('az-AZ', { minimumFractionDigits: 2 })
        const discount = Math.floor(Math.random() * 5) + 3
        const placeholder = 'https://dummyimage.com/400x500/f1f5f9/94a3b8.png?text=AZPIN-X'

        const card = document.createElement('div')
        card.className = 'product-card rounded-2xl p-4 flex flex-col group relative overflow-hidden opacity-0 shadow-sm border border-border bg-surface'

        const stockOverlay = !hasStock ? `
            <div class="absolute inset-0 bg-white/60  backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                <div class="bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-2xl uppercase tracking-widest">Stokda Bitib</div>
            </div>
        ` : ''

        card.innerHTML = `
            ${stockOverlay}
            <div class="aspect-[4/5] rounded-xl bg-white flex items-center justify-center relative overflow-hidden mb-5">
                <img src="${p.image || placeholder}" 
                     class="w-full h-full object-contain transition-transform duration-500"
                     alt="${p.name}" loading="lazy" onerror="this.src='${placeholder}'">
                <div class="absolute bottom-3 right-3 bg-accent text-white text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-accent/20 z-20">
                    -${discount}%
                </div>
            </div>
            <div class="flex-1 flex flex-col px-1">
                <h3 class="text-sm font-black text-black  line-clamp-2 h-10 mb-4 text-center leading-snug uppercase notranslate">
                    ${p.name}
                </h3>
                <div class="mt-auto flex items-center justify-between">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-zinc-400 line-through font-bold leading-none mb-1">${oldPrice} ₼</span>
                        <div class="text-base font-black text-zinc-950  leading-none">${price} <span class="text-[10px]">₼</span></div>
                    </div>
                    <button onclick="addToCart('${p.id}')" class="w-10 h-10 rounded-full keep-round bg-accent text-white transition-all flex items-center justify-center shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 group/btn">
                        <i class="ri-add-line text-lg add-to-cart-icon group-active/btn:scale-90 transition-transform"></i>
                    </button>
                </div>
            </div>
        `
        el.out.appendChild(card)
        gsap.to(card, { opacity: 1, y: 0, duration: 0.4, delay: i * 0.02 })
    })

    renderPagination(pages)
}

function renderPagination(total) {
    const el = getElements()
    if (!el.pagination) return
    el.pagination.innerHTML = ''
    if (total <= 1) return

    // Helper for creating buttons
    const createBtn = (content, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement('button')
        btn.className = `min-w-[44px] h-11 px-3 rounded-xl border flex items-center justify-center font-black text-[11px] transition-all 
            ${isActive ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-surface border-border hover:border-accent hover:text-accent'} 
            ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`
        btn.innerHTML = content
        if (!isDisabled) {
            btn.onclick = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                draw(page)
            }
        }
        return btn
    }

    // Previous Arrow
    el.pagination.appendChild(createBtn('<i class="ri-arrow-left-s-line text-lg"></i>', currentPage - 1, false, currentPage === 1))

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= currentPage - 2 && i <= currentPage + 2)) {
            el.pagination.appendChild(createBtn(i, i, i === currentPage))
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const dot = document.createElement('span')
            dot.innerText = '...'
            dot.className = 'px-1 font-bold opacity-30'
            el.pagination.appendChild(dot)
        }
    }

    // Next Arrow
    el.pagination.appendChild(createBtn('<i class="ri-arrow-right-s-line text-lg"></i>', currentPage + 1, false, currentPage === total))
}

function buildBrands() {
    const el = getElements()
    if (!el.brandList) return

    const brands = [...new Set(db.map(p => p.category_name))].filter(Boolean).sort()
    el.brandList.innerHTML = ''

    const createBrandBtn = (label, value, isActive) => {
        const btn = document.createElement('label')
        btn.className = `flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50  cursor-pointer group transition-all ${isActive ? 'bg-accent/5 border border-accent/20' : 'border border-transparent'}`
        btn.innerHTML = `
            <input type="radio" name="brand" value="${value}" class="w-4 h-4 accent-accent" ${isActive ? 'checked' : ''}>
            <span class="text-[12px] font-bold notranslate ${isActive ? 'text-accent' : 'text-zinc-600  group-hover:text-text'} transition-colors">${label}</span>
        `
        btn.onclick = (e) => {
            selectedBrand = value
            buildBrands()
            draw(1)
        }
        return btn
    }

    el.brandList.appendChild(createBrandBtn('Bütün Markalar', 'all', selectedBrand === 'all'))
    brands.forEach(b => {
        el.brandList.appendChild(createBrandBtn(b, b, selectedBrand === b))
    })
}

function init() {
    const el = getElements()
    el.filterBtn?.addEventListener('click', () => draw(1))

    const searchInputs = [el.find, el.topSearch]
    searchInputs.forEach(inp => {
        inp?.addEventListener('input', () => draw(1))
    })

    const applyTheme = (mode) => {
        document.documentElement.classList.toggle('dark', mode === 'dark')
        localStorage.setItem('theme', mode)
    }
    const savedTheme = localStorage.getItem('theme') || 'light'
    applyTheme(savedTheme)
    el.themeBtn?.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
        applyTheme(next)
    })

    initAuth()
    start()
}

initTransitions()
initSnow()
document.addEventListener('DOMContentLoaded', init)

window.addToCart = (id) => {
    const product = db.find(p => p.id == id)
    if (product) {
        CartManager.add({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        })
    }
}

function initAuth() {
    const modal = document.getElementById('auth-modal')
    const closeBtn = document.getElementById('auth-close')
    const loginBtn = document.getElementById('login-btn')
    const registerBtn = document.getElementById('register-btn')
    const logoutBtn = document.getElementById('logout-btn')
    const userMenu = document.getElementById('user-menu')
    const userName = document.getElementById('user-name')
    const userMenuBtn = document.getElementById('user-menu-btn')
    const userMenuDropdown = document.getElementById('user-menu-dropdown')
    const profileBtn = document.getElementById('profile-btn')
    const profileModal = document.getElementById('profile-modal')
    const profileClose = document.getElementById('profile-close')
    const profileMessage = document.getElementById('profile-message')
    const avatarImg = document.getElementById('profile-avatar')
    const avatarInput = document.getElementById('profile-avatar-input')
    const firstNameInput = document.getElementById('profile-first-name')
    const lastNameInput = document.getElementById('profile-last-name')
    const emailInput = document.getElementById('profile-email')
    const passwordInput = document.getElementById('profile-password')
    const phoneInput = document.getElementById('profile-phone')
    const countrySelect = document.getElementById('profile-country')
    const otpInput = document.getElementById('profile-otp-code')
    const saveBtn = document.getElementById('profile-save')
    const emailBtn = document.getElementById('profile-email-btn')
    const passwordBtn = document.getElementById('profile-password-btn')
    const otpSendBtn = document.getElementById('profile-otp-send')
    const otpVerifyBtn = document.getElementById('profile-otp-verify')
    const UPLOAD_API = '/api/upload'
    const OTP_SEND_API = '/api/otp/send'
    const OTP_VERIFY_API = '/api/otp/verify'
    let avatarUrl = ''
    const tabLogin = document.getElementById('tab-login')
    const tabRegister = document.getElementById('tab-register')
    const loginForm = document.getElementById('login-form')
    const registerForm = document.getElementById('register-form')
    const msg = document.getElementById('auth-message')

    const openModal = (mode) => {
        if (!modal) return
        modal.classList.remove('hidden')
        modal.classList.add('flex')
        setMode(mode)
    }

    const closeModal = () => {
        if (!modal) return
        modal.classList.add('hidden')
        modal.classList.remove('flex')
        if (msg) msg.textContent = ''
    }

    const setMode = (mode) => {
        const isLogin = mode === 'login'
        if (loginForm) loginForm.classList.toggle('hidden', !isLogin)
        if (registerForm) registerForm.classList.toggle('hidden', isLogin)
        tabLogin?.classList.toggle('border-accent', isLogin)
        tabLogin?.classList.toggle('text-accent', isLogin)
        tabLogin?.classList.toggle('bg-accent/5', isLogin)
        tabRegister?.classList.toggle('border-accent', !isLogin)
        tabRegister?.classList.toggle('text-accent', !isLogin)
        tabRegister?.classList.toggle('bg-accent/5', !isLogin)
        tabLogin?.classList.toggle('border-border', !isLogin)
        tabLogin?.classList.toggle('text-text-muted', !isLogin)
        tabRegister?.classList.toggle('border-border', isLogin)
        tabRegister?.classList.toggle('text-text-muted', isLogin)
    }

    loginBtn?.addEventListener('click', (e) => {
        e.preventDefault()
        openModal('login')
    })
    registerBtn?.addEventListener('click', (e) => {
        e.preventDefault()
        openModal('register')
    })
    closeBtn?.addEventListener('click', closeModal)
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal()
    })
    tabLogin?.addEventListener('click', () => setMode('login'))
    tabRegister?.addEventListener('click', () => setMode('register'))

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('login-email')?.value || ''
        const password = document.getElementById('login-password')?.value || ''
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            if (msg) msg.textContent = error.message
            return
        }
        if (msg) msg.textContent = 'Uğurla daxil oldunuz.'
        closeModal()
    })

    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('register-email')?.value || ''
        const password = document.getElementById('register-password')?.value || ''
        const submitBtn = registerForm.querySelector('button[type="submit"]')
        const originalText = submitBtn?.innerHTML
        if (submitBtn) {
            submitBtn.disabled = true
            submitBtn.innerHTML = `
                <span class="inline-flex items-center gap-2">
                    <i class="ri-loader-4-line animate-spin"></i>
                    Göndərilir...
                </span>
            `
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/confirm.html` }
        })
        if (submitBtn) {
            submitBtn.disabled = false
            if (originalText) submitBtn.innerHTML = originalText
        }
        if (error) {
            if (msg) {
                msg.textContent = error.status === 500
                    ? 'Qeydiyyat hazırda bağlıdır. Supabase Auth ayarlarını yoxlayın.'
                    : error.message
            }
            return
        }
        const needsConfirm = !data?.session
        if (data?.user) {
            await supabase.from('profiles').upsert({
                user_id: data.user.id,
                first_name: '',
                last_name: '',
                phone: '',
                avatar_url: ''
            }, { onConflict: 'user_id' })
        }
        if (needsConfirm) {
            window.location.href = '/auth-wait.html'
            return
        }
        if (msg) msg.textContent = 'Qeydiyyat tamamlandı.'
        closeModal()
    })

    logoutBtn?.addEventListener('click', async (e) => {
        e.preventDefault()
        await supabase.auth.signOut()
    })

    const openProfile = async () => {
        const { data } = await supabase.auth.getUser()
        if (!data?.user) {
            openModal('login')
            return
        }
        if (!profileModal) return
        profileModal.classList.remove('hidden')
        profileModal.classList.add('flex')
        if (profileMessage) profileMessage.textContent = ''

        const meta = data.user.user_metadata || {}
        if (avatarImg) avatarImg.src = meta.avatar_url || avatarImg.src
        if (firstNameInput) firstNameInput.value = meta.first_name || ''
        if (lastNameInput) lastNameInput.value = meta.last_name || ''
        if (phoneInput) phoneInput.value = meta.phone || ''
        avatarUrl = meta.avatar_url || ''
    }

    profileBtn?.addEventListener('click', (e) => {
        e.preventDefault()
        openProfile()
    })

    profileClose?.addEventListener('click', () => {
        if (!profileModal) return
        profileModal.classList.add('hidden')
        profileModal.classList.remove('flex')
    })
    profileModal?.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.classList.add('hidden')
            profileModal.classList.remove('flex')
        }
    })

    avatarInput?.addEventListener('change', async () => {
        const file = avatarInput.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('avatar', file)
        const res = await fetch(UPLOAD_API, { method: 'POST', body: formData })
        const json = await res.json()
        if (json?.url) {
            avatarUrl = json.url
            if (avatarImg) avatarImg.src = avatarUrl
        }
    })

    saveBtn?.addEventListener('click', async () => {
        const { data } = await supabase.auth.getUser()
        if (!data?.user) return
        const payload = {
            first_name: firstNameInput?.value || '',
            last_name: lastNameInput?.value || '',
            phone: phoneInput?.value || '',
            avatar_url: avatarUrl || ''
        }
        const { error } = await supabase.auth.updateUser({
            data: {
                ...payload,
                full_name: `${payload.first_name} ${payload.last_name}`.trim()
            }
        })
        if (error) {
            if (profileMessage) profileMessage.textContent = error.message
            return
        }
        await supabase.from('profiles').upsert({
            user_id: data.user.id,
            ...payload
        }, { onConflict: 'user_id' })
        if (profileMessage) profileMessage.textContent = 'Profil yeniləndi.'
        if (userName) userName.textContent = payload.first_name || data.user.email || 'Hesab'
    })

    emailBtn?.addEventListener('click', async () => {
        const email = emailInput?.value || ''
        if (!email) return
        const { error } = await supabase.auth.updateUser({ email })
        if (profileMessage) {
            profileMessage.textContent = error
                ? error.message
                : 'E-mail yeniləmə linki göndərildi.'
        }
    })

    passwordBtn?.addEventListener('click', async () => {
        const password = passwordInput?.value || ''
        if (!password) return
        const { error } = await supabase.auth.updateUser({ password })
        if (profileMessage) profileMessage.textContent = error ? error.message : 'Şifrə yeniləndi.'
    })

    const getFullPhone = () => {
        const code = countrySelect?.value || ''
        const phone = phoneInput?.value || ''
        return `${code}${phone}`.replace(/\s+/g, '')
    }

    otpSendBtn?.addEventListener('click', async () => {
        const phone = getFullPhone()
        if (!phone) return
        const originalText = otpSendBtn.textContent
        otpSendBtn.classList.add('is-loading')
        otpSendBtn.innerHTML = '<span class="inline-flex items-center gap-2"><i class="ri-loader-4-line animate-spin"></i> Göndərilir...</span>'
        const res = await fetch(OTP_SEND_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        })
        const json = await res.json()
        otpSendBtn.classList.remove('is-loading')
        otpSendBtn.textContent = originalText || 'OTP Göndər'
        if (profileMessage) profileMessage.textContent = json?.ok ? 'OTP göndərildi.' : 'OTP göndərilmədi.'
    })

    otpVerifyBtn?.addEventListener('click', async () => {
        const phone = getFullPhone()
        const token = otpInput?.value || ''
        if (!phone || !token) return
        const res = await fetch(OTP_VERIFY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code: token })
        })
        const json = await res.json()
        if (json?.ok) {
            await supabase.auth.updateUser({
                data: { phone, phone_verified: true }
            })
            const { data: u } = await supabase.auth.getUser()
            if (u?.user) {
                await supabase.from('profiles').upsert({
                    user_id: u.user.id,
                    phone,
                    phone_verified: true
                }, { onConflict: 'user_id' })
            }
            if (profileMessage) profileMessage.textContent = 'Telefon təsdiqləndi.'
        } else {
            if (profileMessage) profileMessage.textContent = 'OTP yanlışdır.'
        }
    })

    userMenuBtn?.addEventListener('click', (e) => {
        e.preventDefault()
        userMenuDropdown?.classList.toggle('hidden')
    })

    document.addEventListener('click', (e) => {
        if (!userMenuDropdown || !userMenuBtn) return
        const target = e.target
        if (userMenuBtn.contains(target) || userMenuDropdown.contains(target)) return
        userMenuDropdown.classList.add('hidden')
    })

    const setAuthUI = async (user) => {
        if (user) {
            loginBtn?.classList.add('hidden')
            registerBtn?.classList.add('hidden')
            userMenu?.classList.remove('hidden')
            userMenuDropdown?.classList.add('hidden')
            if (userName) {
                const metaName = user.user_metadata?.full_name
                userName.textContent = metaName || user.email || 'Hesab'
            }
        } else {
            loginBtn?.classList.remove('hidden')
            registerBtn?.classList.remove('hidden')
            userMenu?.classList.add('hidden')
        }
    }

    supabase.auth.getUser().then(({ data }) => setAuthUI(data.user))
    supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUI(session?.user || null)
    })
}
