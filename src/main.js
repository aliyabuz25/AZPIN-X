import './style.css'
import { gsap } from 'gsap'
import { initCart } from './cart'
import { supabase } from './supabase'

const CONFIG = {
    API_URL: '/api',
    DEBOUNCE: 300
}

let db = []
let initialized = false

const getElements = () => ({
    html: document.documentElement,
    appContent: document.getElementById('app-content'),
    landingPage: document.getElementById('landing-page'),
    userDashboard: document.getElementById('user-dashboard'),
    out: document.getElementById('out'),
    info: document.getElementById('count-info'),
    chips: document.getElementById('cat-chips'),
    authModal: document.getElementById('auth-modal'),
    authForm: document.getElementById('auth-form'),
    authTitle: document.getElementById('auth-title'),
    authSwitch: document.getElementById('auth-switch'),
    authClose: document.getElementById('auth-close'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    dashboardBtn: document.getElementById('dashboard-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    authControls: document.getElementById('auth-controls'),
    userControls: document.getElementById('user-controls'),
    loader: document.getElementById('loader')
})

const getIcon = (n) => {
    const l = n.toLowerCase()
    if (l.includes('script')) return 'ri-code-s-slash-line'
    if (l.includes('perplexity')) return 'ri-search-eye-line'
    if (l.includes('google')) return 'ri-google-fill'
    if (l.includes('windows')) return 'ri-windows-fill'
    if (l.includes('adobe')) return 'ri-artboard-line'
    if (l.includes('spotify')) return 'ri-spotify-fill'
    if (l.includes('netflix')) return 'ri-netflix-fill'
    if (l.includes('tiktok')) return 'ri-tiktok-fill'
    if (l.includes('steam')) return 'ri-steam-fill'
    return 'ri-focus-3-line'
}

const getCategoryImage = (n) => {
    const l = n.toLowerCase()
    if (l.includes('pubg')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/oPvP5Mm6qTioNEOktahxlFJh1xeX81G5SygIzbJM.jpg'
    if (l.includes('free fire')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/cITYHPhgFR7jTRbI5cT0QM5NDUGHEdSMz8OmjSPS.webp'
    return null
}

function switchView(view) {
    const el = getElements()
    if (view === 'dashboard') {
        el.landingPage.classList.add('hidden')
        el.userDashboard.classList.remove('hidden')
    } else {
        el.landingPage.classList.remove('hidden')
        el.userDashboard.classList.add('hidden')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function start() {
    const el = getElements()
    try {
        const r = await fetch(`${CONFIG.API_URL}/products`)
        const data = await r.json()
        db = data.data?.products || []
        
        buildCategories()
        if (el.loader) el.loader.style.display = 'none'
        draw(1)
    } catch (e) {
        console.error("Fetch error:", e)
    }
}

function buildCategories() {
    const el = getElements()
    if (!el.chips) return

    const cats = [...new Set(db.map(p => p.category_name))].filter(Boolean)
    
    cats.forEach(c => {
        const chip = document.createElement('button')
        chip.className = 'cat-chip'
        const imgUrl = getCategoryImage(c)
        const innerContent = imgUrl 
            ? `<img src="${imgUrl}" class="w-full h-full object-cover">`
            : `<i class="${getIcon(c)} text-xl text-text-muted"></i>`

        chip.innerHTML = `
            <div class="icon-box">${innerContent}</div>
            <span class="notranslate">${c}</span>
        `
        chip.onclick = () => {
            document.querySelectorAll('.cat-chip').forEach(ch => ch.classList.remove('active-chip'))
            chip.classList.add('active-chip')
            draw(1, c)
        }
        el.chips.appendChild(chip)
    })
}

function draw(page = 1, category = 'all') {
    const el = getElements()
    if (!el.out) return

    const filtered = db.filter(p => category === 'all' || p.category_name === category)
    if (el.info) el.info.innerText = `${filtered.length} məhsul`
    
    el.out.innerHTML = ''
    filtered.forEach(p => {
        const card = document.createElement('div')
        card.className = 'product-card'
        const price = parseFloat(p.price || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2 })
        
        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${p.image || ''}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h3 class="notranslate">${p.name}</h3>
                <div class="price-container">
                    <span class="current-price">${price} ₼</span>
                </div>
            </div>
            <button onclick="addToCart('${p.id}')" class="btn-primary mt-6 w-full">Səbətə At</button>
        `
        el.out.appendChild(card)
    })
}

function init() {
    if (initialized) return
    initialized = true
    initCart();
    
    const el = getElements()
    el.loginBtn?.addEventListener('click', () => switchView('dashboard')) // Temp mock
    el.dashboardBtn?.addEventListener('click', () => switchView('dashboard'))
    
    start()
}

document.addEventListener('DOMContentLoaded', init)
