/**
 * Persistent Shopping Cart Module
 */

import { supabase } from './supabase'

export const CartManager = {
    items: JSON.parse(localStorage.getItem('cart')) || [],

    init() {
        this.renderCount();
        this.render();
        this.bindEvents();
    },

    add(product) {
        const existing = this.items.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image,
                quantity: 1
            });
        }
        this.save();
        this.render();
        this.notify(`Məhsul səbətə əlavə edildi!`);
    },

    remove(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
        this.render();
    },

    updateQuantity(id, delta) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) this.remove(id);
            else this.save();
        }
        this.render();
    },

    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.renderCount();
    },

    renderCount() {
        const counters = document.querySelectorAll('.cart-count');
        const total = this.items.reduce((sum, item) => sum + item.quantity, 0);
        counters.forEach(c => {
            c.innerText = total;
            c.style.display = total > 0 ? 'flex' : 'none';
        });
    },

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    notify(msg) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-10 right-10 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[1000] font-bold text-sm transform transition-all duration-500 translate-y-20 opacity-0';
        toast.innerText = msg;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-20', 'opacity-0');
        }, 100);

        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    bindEvents() {
        document.querySelectorAll('.cart-toggle').forEach(btn => {
            btn.onclick = () => this.toggleDrawer();
        });
        document.querySelectorAll('#checkout-btn').forEach(btn => {
            btn.onclick = () => this.createOrder();
        });
        document.querySelectorAll('#orders-btn').forEach(btn => {
            btn.onclick = () => this.openOrders();
        });
        document.querySelectorAll('#orders-close').forEach(btn => {
            btn.onclick = () => this.closeOrders();
        });
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-upload-receipt]')
            if (!btn) return
            const orderId = btn.getAttribute('data-upload-receipt')
            const input = document.querySelector(`#receipt-${orderId}`)
            input?.click()
        })
        document.addEventListener('change', (e) => {
            const input = e.target
            if (!input || !input.id?.startsWith('receipt-')) return
            const orderId = input.id.replace('receipt-', '')
            this.uploadReceipt(orderId, input.files?.[0])
        })
    },

    toggleDrawer() {
        const drawer = document.getElementById('cart-drawer');
        if (!drawer) return;
        const isHidden = drawer.classList.contains('hidden');
        if (isHidden) {
            this.render();
            drawer.classList.remove('hidden');
        } else {
            drawer.classList.add('hidden');
        }
    },

    async createOrder() {
        const { data } = await supabase.auth.getUser()
        if (!data?.user) {
            const auth = document.getElementById('auth-modal')
            if (auth) {
                auth.classList.remove('hidden')
                auth.classList.add('flex')
            }
            this.notify('Sifarişi tamamlamaq üçün giriş edin.')
            return
        }
        if (this.items.length === 0) return
        const total = this.getTotal()
        const orderItems = this.items.map(i => ({
            product_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            total: i.price * i.quantity
        }))

        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                user_id: data.user.id,
                status: 'pending_payment',
                payment_method: 'c2c',
                total,
                currency: 'AZN'
            })
            .select()
            .single()

        if (error) {
            this.notify('Sifariş yaradılmadı.')
            return
        }

        await supabase.from('order_items').insert(
            orderItems.map(i => ({ ...i, order_id: order.id }))
        )

        const localOrders = JSON.parse(localStorage.getItem('orders_local') || '[]')
        localOrders.unshift({
            id: order.id,
            status: order.status,
            total: order.total,
            created_at: order.created_at,
            receipt_url: null,
            items: orderItems
        })
        localStorage.setItem('orders_local', JSON.stringify(localOrders))

        localStorage.removeItem('cart')
        this.items = []
        this.render()
        this.renderCount()
        this.clearCheckoutForm()
        this.notify('Sifariş yaradıldı. Dekont yükləyin.')
        this.toggleDrawer()
        this.openSuccess(order)

        this.sendOrderNotifications(order, orderItems)
    },

    openSuccess(order) {
        const modal = document.getElementById('success-modal')
        if (!modal) return
        const idEl = document.getElementById('success-order-id')
        const dateEl = document.getElementById('success-order-date')
        if (idEl && order?.id) idEl.textContent = order.id.slice(0, 8)
        if (dateEl && order?.created_at) {
            const d = new Date(order.created_at)
            dateEl.textContent = d.toLocaleString('az-AZ')
        }
        modal.classList.remove('hidden')
        modal.classList.add('flex')
        const closeBtn = document.getElementById('success-close')
        const close = () => {
            modal.classList.add('hidden')
            modal.classList.remove('flex')
        }
        closeBtn?.addEventListener('click', close, { once: true })
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close()
        }, { once: true })
    },

    clearCheckoutForm() {
        const drawer = document.getElementById('cart-drawer')
        if (!drawer) return
        drawer.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]').forEach(inp => {
            inp.value = ''
        })
        drawer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            chk.checked = false
        })
        const radios = drawer.querySelectorAll('input[type="radio"]')
        if (radios.length > 0) {
            radios.forEach(r => (r.checked = false))
            radios[0].checked = true
        }
    },

    async openOrders() {
        const modal = document.getElementById('orders-modal')
        if (!modal) return
        modal.classList.remove('hidden')
        modal.classList.add('flex')
        await this.renderOrders()
    },

    closeOrders() {
        const modal = document.getElementById('orders-modal')
        if (!modal) return
        modal.classList.add('hidden')
        modal.classList.remove('flex')
    },

    async renderOrders() {
        const list = document.getElementById('orders-list')
        if (!list) return
        const { data } = await supabase.auth.getUser()
        if (!data?.user) {
            list.innerHTML = '<p class="text-sm font-bold text-zinc-500">Giriş edin.</p>'
            return
        }
        const localOrders = JSON.parse(localStorage.getItem('orders_local') || '[]')
        const localMap = new Map(localOrders.map(o => [o.id, o]))
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id,status,total,created_at,receipt_url,order_items(name,quantity,price)')
            .eq('user_id', data.user.id)
            .order('created_at', { ascending: false })

        if (error) {
            if (localOrders.length === 0) {
                list.innerHTML = '<p class="text-sm font-bold text-zinc-500">Sifarişlər yüklənmədi.</p>'
                return
            }
            this.renderOrdersList(list, localOrders)
            return
        }
        if (!orders || orders.length === 0) {
            list.innerHTML = '<p class="text-sm font-bold text-zinc-500">Sifariş yoxdur.</p>'
            return
        }

        const orderIds = orders.map(o => o.id)
        let itemsMap = new Map()
        if (orderIds.length > 0) {
            const { data: items } = await supabase
                .from('order_items')
                .select('order_id,name,quantity,price')
                .in('order_id', orderIds)
            if (items) {
                items.forEach(i => {
                    if (!itemsMap.has(i.order_id)) itemsMap.set(i.order_id, [])
                    itemsMap.get(i.order_id).push(i)
                })
            }
        }

        const merged = orders.map(o => {
            const local = localMap.get(o.id)
            o.items = itemsMap.get(o.id) || local?.items || []
            return o
        })

        this.renderOrdersList(list, merged)
    },

    renderOrdersList(list, orders) {
        const statusLabel = (s) => {
            if (s === 'pending_payment') return 'Ödəniş gözlənilir'
            if (s === 'pending_review') return 'Admin təsdiqi gözlənilir'
            if (s === 'paid') return 'Ödənildi'
            return s
        }

        list.innerHTML = orders.map(o => {
            const items = o.order_items || o.items || []
            const itemsHtml = items.length
                ? items.map(i => `<div class="flex justify-between text-xs font-bold"><span>${i.name} x${i.quantity}</span><span>${Number(i.price).toFixed(2)} ₼</span></div>`).join('')
                : '<div class="text-xs text-zinc-500 font-bold">Məhsul yoxdur</div>'
            const statusStyle = o.status === 'pending_payment' ? 'style="background:#261B4DA4"' : ''
            const receiptStatus = o.receipt_url ? '<span class="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1">Dekont yükləndi</span>' : '<span class="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-1">Dekont tələb olunur</span>'
            const disabled = o.receipt_url ? 'disabled' : ''
            const btnText = o.receipt_url ? 'Dekont yükləndi' : 'Dekont yüklə'
            return `
            <div class="border border-border p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black uppercase tracking-widest">#${o.id.slice(0, 8)}</span>
                    <span class="text-[10px] font-black uppercase tracking-widest bg-accent discount-badge px-2 py-1" ${statusStyle}>
                        ${statusLabel(o.status)}
                    </span>
                </div>
                <div class="flex items-center justify-between">
                    ${receiptStatus}
                    ${o.receipt_url ? `<a href="${o.receipt_url}" target="_blank" class="text-xs font-bold text-zinc-600">Dekontu aç</a>` : ''}
                </div>
                ${o.receipt_url ? `<img src="${o.receipt_url}" alt="Dekont" class="w-full max-h-56 object-contain border border-border bg-white">` : ''}
                <div class="border border-dashed border-border p-3 space-y-2 bg-zinc-50">
                    ${itemsHtml}
                </div>
                <div class="text-sm font-black">Cəmi: ${Number(o.total).toFixed(2)} ₼</div>
                <div class="flex items-center gap-3">
                    <input id="receipt-${o.id}" type="file" accept="image/*" class="hidden" ${disabled}>
                    <button data-upload-receipt="${o.id}" class="px-4 py-2 border border-accent text-accent text-xs font-black uppercase tracking-widest" ${disabled}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `}).join('')
    },

    async sendOrderNotifications(order, orderItems) {
        const notifyUrl = import.meta.env?.VITE_NOTIFY_URL
        if (!notifyUrl) return
        const adminPhones = ['994552545214', '905464233871']
        const { data } = await supabase.auth.getUser()
        const customerPhone = data?.user?.user_metadata?.phone || ''
        const itemsText = orderItems.map(i => `${i.name} x${i.quantity}`).join(', ')
        const message = `Yeni sifariş: #${order.id.slice(0, 8)} | Cəmi: ${Number(order.total).toFixed(2)} ₼ | Məhsullar: ${itemsText}`

        try {
            for (const adminPhone of adminPhones) {
                await fetch(notifyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminPhone, customerPhone, message })
                })
            }
        } catch (_e) {
            // silent
        }
    },

    async uploadReceipt(orderId, file) {
        if (!file) return
        const formData = new FormData()
        formData.append('receipt', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (!json?.url) {
            this.notify('Dekont yüklənmədi.')
            return
        }
        await supabase.from('orders').update({
            receipt_url: json.url,
            status: 'pending_review'
        }).eq('id', orderId)
        await this.renderOrders()
        this.notify('Dekont göndərildi.')
    },

    render() {
        const list = document.getElementById('cart-items');
        const subtotalEl = document.getElementById('cart-subtotal');
        if (!list) return;

        if (this.items.length === 0) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div class="w-20 h-20 rounded-full bg-zinc-100  flex items-center justify-center">
                        <i class="ri-shopping-cart-2-line text-3xl opacity-20"></i>
                    </div>
                    <p class="text-zinc-500 font-bold">Səbətiniz boşdur</p>
                    <button class="cart-toggle text-accent font-black text-sm uppercase">Alış-verişə davam et</button>
                </div>`;
            if (subtotalEl) subtotalEl.innerText = '0.00 ₼';
            return;
        }

        list.innerHTML = this.items.map(item => `
            <div class="flex items-center gap-4 p-4 border-b border-border/50 group">
                <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover bg-surface border border-border">
                <div class="flex-1">
                    <h4 class="text-xs font-black text-black  uppercase line-clamp-1">${item.name}</h4>
                    <p class="text-xs font-bold text-accent mt-1">${(item.price * item.quantity).toFixed(2)} ₼</p>
                    <div class="flex items-center gap-3 mt-2">
                        <button onclick="window.Cart.updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded-lg bg-zinc-100  flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                            <i class="ri-subtract-line text-xs font-bold"></i>
                        </button>
                        <span class="text-xs font-black w-4 text-center">${item.quantity}</span>
                        <button onclick="window.Cart.updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded-lg bg-zinc-100  flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                            <i class="ri-add-line text-xs font-bold"></i>
                        </button>
                    </div>
                </div>
                <button onclick="window.Cart.remove(${item.id})" class="p-2 text-zinc-300 hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                    <i class="ri-delete-bin-line text-lg"></i>
                </button>
            </div>
        `).join('');

        if (subtotalEl) subtotalEl.innerText = `${this.getTotal().toFixed(2)} ₼`;
    }
};

window.Cart = CartManager;
export const initCart = () => CartManager.init();
