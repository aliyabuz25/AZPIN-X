import './style.css'
import { gsap } from 'gsap'

// --- Global State ---
window.state = {
    products: [],
    categories: [],
    user: null,
    cart: [],
    view: 'home'
}

const CONFIG = {
    API_URL: '/api'
}

// --- Utilities ---
const $ = (id) => document.getElementById(id)
const $$ = (sel) => document.querySelectorAll(sel)

// --- Router ---
window.router = {
    go(view) {
        state.view = view
        $$('.view').forEach(v => v.classList.add('hidden'))
        $(`view-${view}`).classList.remove('hidden')
        window.scrollTo({ top: 0, behavior: 'instant' })

        if (view === 'dashboard') ui.syncDashboard()
    }
}

// --- UI Logic ---
window.ui = {
    init() {
        $('page-loader').style.display = 'none'
        router.go('home')
        this.bindEvents()
        this.fetchData()
    },

    bindEvents() {
        $('auth-entry')?.addEventListener('click', () => {
            $('auth-modal').style.display = 'flex'
        })
    },

    closeModals() {
        $('auth-modal').style.display = 'none'
    },

    notify(text, type = 'accent') {
        const box = $('notif-box')
        const n = document.createElement('div')
        n.style.padding = '20px 32px'
        n.style.background = 'var(--bg)'
        n.style.border = `2px solid var(--accent)`
        n.style.borderRadius = '24px'
        n.style.fontWeight = '800'
        n.style.boxShadow = 'var(--shadow-lg)'
        n.style.transform = 'translateY(20px)'
        n.style.opacity = '0'
        n.textContent = text
        box.appendChild(n)

        gsap.to(n, { opacity: 1, y: 0, duration: 0.4 })
        setTimeout(() => {
            gsap.to(n, { opacity: 0, y: 10, duration: 0.3, onComplete: () => n.remove() })
        }, 3000)
    },

    async fetchData() {
        try {
            const r = await fetch(`${CONFIG.API_URL}/products`)
            const d = await r.json()
            state.products = d.data?.products || []
            this.render()
        } catch (e) {
            this.notify("Məlumat yüklənmədi.")
        }
    },

    render() {
        this.renderCategories()
        this.renderProducts()
    },

    renderCategories() {
        const wrap = $('discovery-chips')
        if (!wrap) return

        const cats = [...new Set(state.products.map(p => p.category_name))].filter(Boolean)

        cats.forEach(c => {
            const btn = document.createElement('button')
            btn.className = 'cat-item'
            btn.innerHTML = `
                <div class="cat-icon-box"><i class="${this.getIcon(c)} text-2xl"></i></div>
                <span class="notranslate">${c}</span>
            `
            btn.onclick = () => {
                $$('.cat-item').forEach(i => i.classList.remove('active'))
                btn.classList.add('active')
                this.renderProducts(c)
            }
            wrap.appendChild(btn)
        })
    },

    renderProducts(filter = 'all') {
        const out = $('product-out')
        if (!out) return

        const filtered = state.products.filter(p => filter === 'all' || p.category_name === filter)
        out.innerHTML = ''

        filtered.forEach((p, i) => {
            const card = document.createElement('div')
            card.className = 'item-card fadeIn'
            card.style.animationDelay = `${i * 0.05}s`
            const price = parseFloat(p.price || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2 })

            card.innerHTML = `
                <div class="item-media">
                    <img src="${p.image || ''}" alt="${p.name}">
                </div>
                <h3 class="item-name notranslate">${p.name}</h3>
                <div class="item-meta">
                    <span class="price-tag">${price} ₼</span>
                    <button onclick="shop.add('${p.id}')" class="btn-main" style="padding: 12px 20px;"><i class="ri-add-line"></i></button>
                </div>
            `
            out.appendChild(card)
        })
    },

    getIcon(n) {
        const l = n.toLowerCase()
        if (l.includes('pubg')) return 'ri-gamepad-line'
        if (l.includes('gift')) return 'ri-gift-line'
        if (l.includes('steam')) return 'ri-steam-fill'
        if (l.includes('netflix')) return 'ri-netflix-fill'
        if (l.includes('spotify')) return 'ri-spotify-fill'
        return 'ri-focus-3-line'
    },

    syncDashboard() {
        if (!state.user) {
            router.go('home')
            this.notify("Giriş etməlisiniz.")
            $('auth-modal').style.display = 'flex'
        }
    }
}

// --- Shop Logic ---
window.shop = {
    add(id) {
        const p = state.products.find(x => String(x.id) === String(id))
        if (!p) return
        state.cart.push(p)
        $('bag-count').textContent = state.cart.length
        ui.notify(`${p.name} səbətə əlavə edildi.`)
    }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => ui.init())
