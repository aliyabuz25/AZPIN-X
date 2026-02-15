            </div>
            <div class="lane-fade">
                <div class="product-lane scrollbar-hide"></div>
            </div>
        `
        const row = section.querySelector('.product-lane')
        items.forEach((p, i) => {
            const hasStock = p.in_stock === true || parseInt(p.stock) > 0
            const card = document.createElement('div')
            const { price, sale, regular } = getPriceFields(p)
            const finalPrice = sale || price || 0
            const priceText = finalPrice.toLocaleString('az-AZ', { minimumFractionDigits: 2 })
            const basePrice = regular || price || finalPrice
            const oldPrice = basePrice > finalPrice ? basePrice : finalPrice * 1.05
            const placeholder = 'https://dummyimage.com/400x500/f1f5f9/94a3b8.png?text=AZPIN-X'

            const stockOverlay = !hasStock ? `
                <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                    <div class="bg-zinc-900 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-2xl uppercase tracking-widest">Stokda Bitib</div>
                </div>
            ` : ''

            card.className = 'product-card product-lane-item rounded-2xl p-4 flex flex-col group relative overflow-hidden opacity-0 shadow-sm border border-border bg-surface'
            card.innerHTML = `
                ${stockOverlay}
                <div class="aspect-[4/5] rounded-xl bg-white flex items-center justify-center relative overflow-hidden mb-5">
                    <img src="${p.image || placeholder}"
                         class="w-full h-full object-contain transition-transform duration-500"
                         alt="${p.name}"
                         loading="lazy"
                         onerror="this.src='${placeholder}'">
                    <div class="absolute bottom-3 right-3 bg-accent discount-badge text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-accent/20 z-20">
                        Endirim
                    </div>
                </div>
                <div class="flex-1 flex flex-col px-1">
                    <h3 class="text-sm font-black text-black line-clamp-2 h-10 mb-4 text-center leading-snug uppercase notranslate">
                        ${p.name}
                    </h3>
                    <div class="mt-auto flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-zinc-400 line-through font-bold leading-none mb-1">${oldPrice.toFixed(2)} ₼</span>
                            <div class="text-base font-black text-zinc-950 leading-none">${priceText} <span class="text-[10px]">₼</span></div>
                        </div>
                        <button onclick="addToCart('${p.id}')" class="w-10 h-10 rounded-full keep-round bg-accent text-white transition-all flex items-center justify-center shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 group/btn">
                        <i class="ri-add-line text-lg add-to-cart-icon group-active/btn:scale-90 transition-transform"></i>
                    </button>
                    </div>
                </div>
            `
            row.appendChild(card)
            gsap.to(card, { opacity: 1, y: 0, duration: 0.4, delay: i * 0.02 })
        })

        el.out.appendChild(section)
    })
}

function renderPagination(total) {
    const paginer = document.getElementById('pagination')
    if (!paginer) return
    paginer.innerHTML = ''
    if (total <= 1) return

    const createBtn = (content, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement('button')
        btn.className = `min-w-[48px] h-12 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-center transition-all 
            ${isActive ? 'bg-accent text-white border-accent shadow-xl shadow-accent/25' : 'bg-surface border-border text-text hover:border-accent hover:text-accent'} 
            ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`
        btn.innerHTML = content
        if (!isDisabled) {
            btn.onclick = () => {
                const outTop = document.getElementById('out')?.offsetTop || 0
                window.scrollTo({ top: outTop - 150, behavior: 'smooth' })
                draw(page)
            }
        }
        return btn
    }

    paginer.appendChild(createBtn('<i class="ri-arrow-left-s-line text-xl"></i>', currentPage - 1, false, currentPage === 1))

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginer.appendChild(createBtn(i, i, i === currentPage))
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const span = document.createElement('span')
            span.innerText = '...'
            span.className = 'w-10 text-center font-bold text-text-muted opacity-50'
            paginer.appendChild(span)
        }
    }

    paginer.appendChild(createBtn('<i class="ri-arrow-right-s-line text-xl"></i>', currentPage + 1, false, currentPage === total))
}

function showSlide(idx) {
    const el = getElements()
    const slide = el.slides[idx]
    if (!slide) return

    gsap.to(el.slider, {
        x: `- ${idx * 100}% `,
        duration: 1.2,
        ease: 'expo.inOut'
    })

    el.dots.forEach((d, i) => {
        d.classList.toggle('w-10', i === idx)
        d.classList.toggle('bg-accent', i === idx)
        d.classList.toggle('bg-white/20', i !== idx)
    })

    if (el.progress) {
        el.progress.style.transition = 'none'
        el.progress.style.width = '0%'
        el.progress.offsetHeight
        el.progress.style.transition = `width ${CONFIG.SLIDE_TIME}ms linear`
        el.progress.style.width = '100%'
    }

    currentSlide = idx
}

function stopSlideTimer() {
    if (slideInterval) {
        clearInterval(slideInterval)
        slideInterval = null
    }
}

function startSlideTimer() {
    stopSlideTimer()
    const el = getElements()
    if (el.slides.length === 0) return
    slideInterval = setInterval(() => {
        showSlide((currentSlide + 1) % el.slides.length)
    }, CONFIG.SLIDE_TIME)
}

const toast = (msg, type = 'accent') => {
    const container = document.getElementById('notif-container')
    if (!container) return
    const t = document.createElement('div')
    t.className = `px-6 py-4 bg-white border border-border shadow-2xl rounded-2xl flex items-center gap-4 animate-in min-w-[300px]`
    const icon = type === 'success' ? 'ri-checkbox-circle-fill text-green-500' : (type === 'error' ? 'ri-error-warning-fill text-red-500' : 'ri-information-fill text-accent')
    t.innerHTML = `
        <i class="${icon} text-2xl"></i>
        <div class="flex-1">
            <p class="text-[11px] font-black uppercase tracking-widest text-text-muted mb-0.5">${type === 'success' ? 'Uğurlu' : (type === 'error' ? 'Xəta' : 'Bildiriş')}</p>
            <p class="text-sm font-bold text-text">${msg}</p>
        </div>
    `
    container.appendChild(t)
    setTimeout(() => {
        t.style.opacity = '0'
        t.style.transform = 'translateX(20px)'
        setTimeout(() => t.remove(), 500)
    }, 4000)
}

function init() {
    if (initialized) return
    initialized = true
    initCart();
    const el = getElements()

    const handleSearch = () => {
        clearTimeout(searchTimer)
        searchTimer = setTimeout(() => draw(1), CONFIG.DEBOUNCE)
    }

    el.find?.addEventListener('input', handleSearch)
    el.stock?.addEventListener('change', () => draw(1))
    el.limit?.addEventListener('change', () => draw(1))

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

    document.addEventListener('click', (e) => {
        const dot = e.target.closest('.dot')
        if (!dot) return
        const idx = parseInt(dot.dataset.index || '0', 10)
        if (Number.isNaN(idx)) return
        showSlide(idx)
        startSlideTimer()
    })

    initAuth()

    document.getElementById('chip-all')?.addEventListener('click', () => {
        const catSelector = document.getElementById('cat')
        if (catSelector) catSelector.value = 'all'

        document.querySelectorAll('.cat-chip').forEach(ch => {
            ch.classList.remove('active-chip')
            const inner = ch.querySelector('.active-chip-bg')
            if (inner) inner.classList.replace('border-accent', 'border-border')
            const text = ch.querySelector('span')
            if (text) text.classList.replace('text-accent', 'text-text-muted')
        })

        const chipAll = document.getElementById('chip-all')
        if (chipAll) {
            chipAll.classList.add('active-chip')
            const inner = chipAll.querySelector('.active-chip-bg')
            if (inner) inner.classList.replace('border-border', 'border-accent')
            const text = chipAll.querySelector('span')
            if (text) text.classList.replace('text-text-muted', 'text-accent')
        }
        draw(1)
    })

    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#cat-toggle')
        if (!toggleBtn) return
        categoriesExpanded = !categoriesExpanded
        updateCategoryVisibility()
    })

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn')
    const mobileMenu = document.getElementById('mobile-menu')
    const mobileMenuClose = document.getElementById('mobile-menu-close')
    const mobileAuthButtons = document.getElementById('mobile-auth-buttons')

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden')
            mobileMenu.classList.add('flex')
        })
    }

    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.add('hidden')
            mobileMenu.classList.remove('flex')
        })
    }

    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.add('hidden')
                mobileMenu.classList.remove('flex')
            }
        })
    }

    start()
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

        // Ensure mobile menu is closed when opening auth modal
        const mobileMenu = document.getElementById('mobile-menu')
        if (mobileMenu) {
            mobileMenu.classList.add('hidden')
            mobileMenu.classList.remove('flex')
        }
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

    // Mobile Auth Buttons Logic
    document.querySelectorAll('.mobile-login-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault()
            openModal('login')
        })
    })
    document.querySelectorAll('.mobile-register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault()
            openModal('register')
        })
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
            options: { emailRedirectTo: `${window.location.origin}/confirm` }
        })
        if (submitBtn) {
            submitBtn.disabled = false
            if (originalText) submitBtn.innerHTML = originalText
        }
        if (error) {
            if (msg) {
                // Show actual error to help debugging
                console.error('Supabase Auth Info:', JSON.stringify(error, null, 2))
                msg.textContent = `Xəta (${error.status || 'N/A'}): ${error.message}`
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
        try {
            const res = await fetch(OTP_SEND_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })
            const json = await res.json()
            if (profileMessage) profileMessage.textContent = json?.ok ? 'OTP göndərildi.' : 'OTP göndərilmədi.'
        } catch (_e) {
            if (profileMessage) profileMessage.textContent = 'OTP servisinə qoşulmaq olmadı.'
        } finally {
            otpSendBtn.classList.remove('is-loading')
            otpSendBtn.textContent = originalText || 'OTP Göndər'
        }
    })

    otpVerifyBtn?.addEventListener('click', async () => {
        const phone = getFullPhone()
        const token = otpInput?.value || ''
        if (!phone || !token) return
        try {
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
        } catch (_e) {
            if (profileMessage) profileMessage.textContent = 'OTP servisinə qoşulmaq olmadı.'
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

    const fetchWallet = async (userId) => {
        const { data, error } = await supabase.from('reseller_wallets').select('balance').eq('reseller_id', userId).maybeSingle()
        const balanceEl = document.getElementById('header-balance')
        if (balanceEl) {
            const val = data?.balance || 0
            balanceEl.textContent = `${val.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼`
        }
    }

    // Mobile User Actions
    const mobileProfileBtn = document.querySelector('.mobile-profile-btn')
    const mobileOrdersBtn = document.querySelector('.mobile-orders-btn')
    const mobileLogoutBtn = document.querySelector('.mobile-logout-btn')

    mobileProfileBtn?.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobile-menu')
        if (mobileMenu) mobileMenu.classList.add('hidden');
        openProfile()
    })
    mobileOrdersBtn?.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobile-menu')
        if (mobileMenu) mobileMenu.classList.add('hidden');
        const ordersBtn = document.getElementById('orders-btn')
        if (ordersBtn) ordersBtn.click()
    })
    mobileLogoutBtn?.addEventListener('click', async () => {
        const mobileMenu = document.getElementById('mobile-menu')
        if (mobileMenu) mobileMenu.classList.add('hidden');
        await supabase.auth.signOut()
    })

    const setAuthUI = async (user) => {
        const mobileAuth = document.getElementById('mobile-auth-buttons')
        const mobileUser = document.getElementById('mobile-user-section')
        const mobileUserName = document.getElementById('mobile-user-name')

        if (user) {
            loginBtn?.classList.add('hidden')
            registerBtn?.classList.add('hidden')
            userMenu?.classList.remove('hidden')
            userMenuDropdown?.classList.add('hidden')

            // Update Mobile Menu
            if (mobileAuth) mobileAuth.classList.add('hidden')
            if (mobileUser) mobileUser.classList.remove('hidden')

            if (userName) {
                const metaName = user.user_metadata?.full_name
                const finalName = metaName || user.email || 'Hesab'
                userName.textContent = finalName
                if (mobileUserName) mobileUserName.textContent = finalName.split('@')[0]
            }

            fetchWallet(user.id)
            // Realtime balance sync
            supabase.channel('wallet_changes')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reseller_wallets', filter: `reseller_id=eq.${user.id}` }, (payload) => {
                    const balanceEl = document.getElementById('header-balance')
                    if (balanceEl) {
                        const val = payload.new.balance || 0
                        balanceEl.textContent = `${val.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼`
                        toast(`Balansınız yeniləndi: ${val.toFixed(2)} ₼`, 'success')
                    }
                })
                .subscribe()
        } else {
            loginBtn?.classList.remove('hidden')
            registerBtn?.classList.remove('hidden')
            userMenu?.classList.add('hidden')

            // Update Mobile Menu
            if (mobileAuth) mobileAuth.classList.remove('hidden')
            if (mobileUser) mobileUser.classList.add('hidden')
        }
    }

    supabase.auth.getUser().then(({ data }) => setAuthUI(data.user))
    supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUI(session?.user || null)
    })
}

window.addToCart = (id) => {
    const product = db.find(p => p.id == id);
    if (product) {
        CartManager.add({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
    }
};

initTransitions()
initSnow()
document.addEventListener('DOMContentLoaded', init)
if (document.readyState !== 'loading') init()
