import './style.css'
import { gsap } from 'gsap'
import { initTransitions } from './transitions'
import { initSnow } from './snow'
import { initCart, CartManager } from './cart'
import { supabase } from './supabase'

const CONFIG = {
    API_URL: '/api', // Use local proxy
    DEBOUNCE: 300,
    SLIDE_TIME: 10000
}

let db = []
let currentPage = 1
let currentSlide = 0
let searchTimer
let slideInterval
let categoriesExpanded = false
let initialized = false

const getElements = () => ({
    html: document.documentElement,
    themeBtn: document.getElementById('thm-btn'),
    slider: document.getElementById('slider'),
    slides: document.querySelectorAll('.slide'),
    dots: document.querySelectorAll('.dot'),
    progress: document.getElementById('slide-progress'),
    loader: document.getElementById('loader'),
    out: document.getElementById('out'),
    pag: document.getElementById('pagination'),
    info: document.getElementById('count-info'),
    find: document.getElementById('find'),
    catSelect: document.getElementById('cat'),
    stock: document.getElementById('stock'),
    limit: document.getElementById('limit'),
    chips: document.getElementById('cat-chips')
})



async function start() {
    const loader = document.getElementById('loader')
    if (loader) loader.style.display = 'block'

    try {
        const r = await fetch(`${CONFIG.API_URL}/products`)
        const d = await r.json()
        db = d.data?.products || []

        buildHeroSlides()
        buildCategories()
        if (loader) loader.style.display = 'none'
        draw(1)
    } catch (e) {
        console.error("Fetch error:", e)
        if (loader) {
            loader.innerText = 'Xəta: Məhsullar yüklənə bilmədi.'
            loader.classList.remove('animate-pulse')
        }
    }
}

function buildHeroSlides() {
    const el = getElements()
    const dotsContainer = document.getElementById('hero-dots')
    if (!el.slider || !dotsContainer) return

    const candidates = db.filter(p => p?.name)
    if (candidates.length === 0) return

    const palette = ['#ff4655', '#ffb000', '#22c55e', '#0ea5e9', '#8b5cf6', '#f97316', '#14b8a6']
    const taglines = [
        'Yeni gələnlər',
        'Ən çox satılan',
        'Limitli endirim',
        'Sürətli təslimat',
        'Etibarlı kodlar',
        'Oyun vaxtı!',
        'Eksklüziv təklif'
    ]
    const descTemplates = [
        (p, price) => `${p.category_name || 'Məhsul'} üçün ideal seçim. İndi ${price} ₼.`,
        (p, price) => `Saniyələr içində təslimat. Qiymət: ${price} ₼.`,
        (p, price) => `Yeni sezon üçün hazır ol. ${price} ₼ ilə əldə et.`,
        (p, price) => `Premium keyfiyyət, təhlükəsiz alış. ${price} ₼.`,
        (p, price) => `Dərhal aktivləşir, problemsiz istifadə. ${price} ₼.`
    ]
    const unique = []
    const seen = new Set()
    candidates.forEach((p) => {
        const keyParts = [
            p.id || '',
            p.name || '',
            p.category_name || '',
            p.price || '',
            p.image || ''
        ]
        const key = keyParts.join('|').toLowerCase()
        if (!key.trim() || seen.has(key)) return
        seen.add(key)
        unique.push(p)
    })

    const gameKeywords = [
        'valorant', 'pubg', 'steam', 'roblox', 'free fire', 'riot',
        'xbox', 'playstation', 'nintendo', 'google play', 'itunes', 'apple'
    ]

    const isGame = (p) => {
        const text = `${p.name || ''} ${p.category_name || ''}`.toLowerCase()
        return gameKeywords.some(k => text.includes(k))
    }

    const todayKey = new Date().toISOString().slice(0, 10)
    const hashString = (str) => {
        let h = 0
        for (let i = 0; i < str.length; i++) {
            h = (h * 31 + str.charCodeAt(i)) | 0
        }
        return Math.abs(h)
    }

    const stableShuffle = (arr) => {
        return [...arr].sort((a, b) => {
            const ka = `${todayKey}-${a.id || a.name || ''}`
            const kb = `${todayKey}-${b.id || b.name || ''}`
            return hashString(ka) - hashString(kb)
        })
    }

    const gamePool = stableShuffle(unique.filter(isGame))
    const otherPool = stableShuffle(unique.filter(p => !isGame(p)))

    const picks = [...gamePool.slice(0, 5)]
    if (picks.length < 5) {
        picks.push(...otherPool.slice(0, 5 - picks.length))
    }

    el.slider.innerHTML = ''
    dotsContainer.innerHTML = ''

    picks.forEach((p, i) => {
        const color = palette[i % palette.length]
        const img = p.image || 'https://dummyimage.com/1400x600/f1f5f9/94a3b8.png?text=AZPIN-X'
        const price = parseFloat(p.price || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2 })
        const subtitle = taglines[i % taglines.length]
        const description = descTemplates[i % descTemplates.length](p, price)

        const slide = document.createElement('div')
        slide.className = `min-w-full w-full h-full relative shrink-0 slide ${i === 0 ? 'active' : ''}`
        slide.dataset.color = color
        slide.innerHTML = `
            <img src="${img}" class="w-full h-full object-cover" alt="${p.name}" loading="${i === 0 ? 'eager' : 'lazy'}">
            <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-center px-12 md:px-20 text-white max-w-2xl">
                <span class="text-accent font-black tracking-[0.3em] text-[10px] uppercase mb-4 block">${subtitle}</span>
                <h2 class="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-[0.9] italic uppercase">
                    ${p.name}
                </h2>
                <p class="text-[13px] text-zinc-300 mb-8 leading-relaxed max-w-sm font-medium">
                    ${description}
                </p>
                <div class="flex gap-4">
                    <a href="/products.html"
                        class="px-10 py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/25">
                        İndi Al
                    </a>
                    <a href="/products.html"
                        class="px-10 py-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
                        Detallar
                    </a>
                </div>
            </div>
        `
        el.slider.appendChild(slide)

        const dot = document.createElement('div')
        dot.className = `dot w-3 h-3 rounded-full bg-white/20 cursor-pointer transition-all hover:bg-white/40 ${i === 0 ? 'active-dot' : ''}`
        dot.dataset.index = String(i)
        dotsContainer.appendChild(dot)
    })

    currentSlide = 0
    showSlide(0)
    startSlideTimer()
}

function buildCategories() {
    const chipContainer = document.getElementById('cat-chips')
    const catSelector = document.getElementById('cat')
    if (!chipContainer || !catSelector) return

    const cats = [...new Set(db.map(p => p.category_name))].filter(Boolean)
    catSelector.innerHTML = '<option value="all">Hamısı</option>'
    cats.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c
        opt.textContent = c
        catSelector.appendChild(opt)
    })
    const getIcon = (n) => {
        const l = n.toLowerCase()
        if (l.includes('script')) return 'ri-code-s-slash-line'
        if (l.includes('perplexity')) return 'ri-search-eye-line'
        if (l.includes('google')) return 'ri-google-fill'
        if (l.includes('kiro')) return 'ri-robot-line'
        if (l.includes('autodesk')) return 'ri-brush-3-line'
        if (l.includes('windows')) return 'ri-windows-fill'
        if (l.includes('adobe')) return 'ri-artboard-line'
        if (l.includes('sql') || l.includes('server')) return 'ri-database-2-line'
        if (l.includes('antivür') || l.includes('vpn') || l.includes('antivirus')) return 'ri-shield-keyhole-line'
        if (l.includes('claude')) return 'ri-chat-voice-line'
        if (l.includes('gmail') || l.includes('mail')) return 'ri-mail-line'
        if (l.includes('jetbrains')) return 'ri-code-box-line'
        if (l.includes('midjourney')) return 'ri-palette-line'
        if (l.includes('capcut')) return 'ri-video-line'
        if (l.includes('figma')) return 'ri-figma-line'
        if (l.includes('canva')) return 'ri-artboard-2-line'
        if (l.includes('flaticon')) return 'ri-image-2-line'
        if (l.includes('corel')) return 'ri-paint-brush-line'
        if (l.includes('ideogram')) return 'ri-pencil-ruler-line'
        if (l.includes('grammerly')) return 'ri-quill-pen-line'
        if (l.includes('quillbot')) return 'ri-edit-line'
        if (l.includes('duolingo')) return 'ri-translate-2'
        if (l.includes('project') || l.includes('visio')) return 'ri-layout-masonry-line'
        if (l.includes('wpilot') || l.includes('wordpress')) return 'ri-wordpress-fill'
        if (l.includes('chatgpt')) return 'ri-chat-smile-2-line'
        if (l.includes('seo')) return 'ri-line-chart-line'
        if (l.includes('motion array')) return 'ri-movie-line'
        if (l.includes('freepik') || l.includes('envato')) return 'ri-landscape-line'
        if (l.includes('spotify')) return 'ri-spotify-fill'
        if (l.includes('office')) return 'ri-microsoft-fill'
        if (l.includes('netflix')) return 'ri-netflix-fill'
        if (l.includes('tiktok')) return 'ri-tiktok-fill'
        if (l.includes('steam')) return 'ri-steam-fill'
        if (l.includes('shutterstock') || l.includes('ui8')) return 'ri-camera-lens-line'
        return 'ri-focus-3-line'
    }

    const getCategoryImage = (n) => {
        const l = n.toLowerCase()
        if (l.includes('pubg')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/oPvP5Mm6qTioNEOktahxlFJh1xeX81G5SygIzbJM.jpg'
        if (l.includes('free fire')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/cITYHPhgFR7jTRbI5cT0QM5NDUGHEdSMz8OmjSPS.webp'
        if (l.includes('tiktok')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/mclb8oY49LqD2t09P282jksD66Lp282jksD66Lp.webp'
        if (l.includes('netflix')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/7iO282jksD66Lp282jksD66Lp7iO282jksD66Lp.webp'
        if (l.includes('spotify')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/p6y282jksD66Lp282jksD66Lpp6y.webp'
        if (l.includes('steam')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/uYp282jksD66Lp282jksD66LpuYp.webp'
        if (l.includes('office') || l.includes('windows') || l.includes('microsoft')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/JkP282jksD66Lp282jksD66LpJkP.webp'
        if (l.includes('google')) return 'https://epin.az/_ipx/w_96&f_webp/https://rest.epin.az/storage/categories/gGl282jksD66Lp282jksD66LpgGl.webp'
        return null
    }

    cats.forEach(c => {
        const chip = document.createElement('button')
        chip.className = 'flex flex-col items-center gap-3 shrink-0 transition-all active:scale-95 cat-chip'
        const imgUrl = getCategoryImage(c)
        const innerContent = imgUrl
            ? `<img src="${imgUrl}" class="w-full h-full object-cover rounded-2xl" alt="${c}">`
            : `<i class="${getIcon(c)} text-2xl text-accent"></i>`

        chip.innerHTML = `
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center group-hover:shadow-md transition-all active-chip-bg">
                ${innerContent}
            </div>
            <span class="text-[10px] font-black uppercase tracking-tight text-text-muted group-hover:text-accent transition-colors text-center max-w-[80px] leading-tight notranslate">${c}</span>
        `
        chip.onclick = () => {
            const catSelector = document.getElementById('cat')
            if (catSelector) catSelector.value = (catSelector.value === c) ? 'all' : c

            document.querySelectorAll('.cat-chip').forEach(ch => {
                ch.classList.remove('active-chip')
                const inner = ch.querySelector('.active-chip-bg')
                if (inner) inner.classList.replace('border-accent', 'border-border')
                const text = ch.querySelector('span')
                if (text) text.classList.replace('text-accent', 'text-text-muted')
            })

            const activeCat = catSelector.value
            if (activeCat === 'all') {
                const chipAll = document.getElementById('chip-all')
                if (chipAll) chipAll.classList.add('active-chip')
            } else {
                chip.classList.add('active-chip')
                const inner = chip.querySelector('.active-chip-bg')
                if (inner) inner.classList.replace('border-border', 'border-accent')
                const text = chip.querySelector('span')
                if (text) text.classList.replace('text-text-muted', 'text-accent')
            }
            draw(1)
        }
        chipContainer.appendChild(chip)
    })

    updateCategoryVisibility()
}

function updateCategoryVisibility() {
    const chipContainer = document.getElementById('cat-chips')
    const toggleBtn = document.getElementById('cat-toggle')
    if (!chipContainer || !toggleBtn) return

    const chips = [...chipContainer.querySelectorAll('.cat-chip')]
    const maxVisible = 10
    chips.forEach((chip, idx) => {
        if (idx === 0) {
            chip.classList.remove('hidden')
            return
        }
        if (categoriesExpanded || idx < maxVisible) chip.classList.remove('hidden')
        else chip.classList.add('hidden')
    })

    if (chips.length <= maxVisible) {
        toggleBtn.classList.add('hidden')
    } else {
        toggleBtn.classList.remove('hidden')
        toggleBtn.textContent = categoriesExpanded ? 'Daha az' : 'Daha çox'
    }
}

function draw(page = 1) {
    const el = getElements()
    if (!el.out) return

    currentPage = page
    const qValue = el.find?.value?.toLowerCase() || ''
    const category = el.catSelect?.value || 'all'
    const stockStatus = el.stock?.value || 'all'

    const filtered = db.filter(p => {
        const okQ = (p.name || '').toLowerCase().includes(qValue)
        const okC = category === 'all' || p.category_name === category
        const hasStock = p.in_stock === true || parseInt(p.stock) > 0
        const okS = stockStatus === 'all' || (stockStatus === 'in' && hasStock)
        return okQ && okC && okS
    })

    filtered.sort((a, b) => {
        const aStock = a.in_stock === true || parseInt(a.stock) > 0
        const bStock = b.in_stock === true || parseInt(b.stock) > 0
        if (aStock && !bStock) return -1
        if (!aStock && bStock) return 1
        return 0
    })

    const toNum = (v) => {
        const n = parseFloat(v)
        return Number.isNaN(n) ? null : n
    }

    const getPriceFields = (p) => {
        const price = toNum(p.price)
        const sale = toNum(p.sale_price ?? p.discounted_price ?? p.discount_price ?? p.special_price)
        const regular = toNum(p.regular_price ?? p.old_price)
        const discountRate = toNum(p.discount ?? p.discount_rate ?? p.discount_percent)
        return { price, sale, regular, discountRate }
    }

    const isDiscounted = (p) => {
        const { price, sale, regular, discountRate } = getPriceFields(p)
        if (sale && price && sale < price) return true
        if (regular && price && regular > price) return true
        if (discountRate && discountRate > 0) return true
        return false
    }

    const discounted = filtered.filter(isDiscounted)
    const normalItems = filtered.filter(p => !isDiscounted(p))
    const isSteam = (p) => {
        const text = `${p.name || ''} ${p.category_name || ''}`.toLowerCase()
        return text.includes('steam')
    }
    const steamItems = normalItems.filter(isSteam)
    const displayItems = steamItems.length > 0 ? steamItems : normalItems
    if (el.info) el.info.innerText = `${normalItems.length} məhsul`
    el.out.innerHTML = ''
    if (el.pag) el.pag.innerHTML = ''

    if (displayItems.length === 0) {
        el.out.innerHTML = `<div class="py-20 text-center text-text-muted font-bold text-lg">Hal-hazırda normal məhsul yoxdur.</div>`
        return
    }

    const byCategory = new Map()
    displayItems.forEach(p => {
        const key = p.category_name || 'Digər'
        if (!byCategory.has(key)) byCategory.set(key, [])
        byCategory.get(key).push(p)
    })

    byCategory.forEach((items, catName) => {
        const section = document.createElement('div')
        section.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h4 class="text-[11px] font-black uppercase tracking-[0.25em] text-text-muted">${catName}</h4>
                    <p class="text-xs font-bold text-zinc-500 mt-1">${items.length} məhsul</p>
                </div>
