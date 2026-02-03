import { CartManager } from './cart';
import { initTransitions } from './transitions';

const EL = {
    itemList: document.getElementById('checkout-items'),
    total: document.getElementById('checkout-total'),
    count: document.getElementById('checkout-count'),
    btn: document.getElementById('complete-order'),
    copyBtn: document.getElementById('copy-card'),
    cardNum: document.getElementById('owner-card'),
    firstName: document.getElementById('first-name'),
    lastName: document.getElementById('last-name'),
    contact: document.getElementById('contact'),
    terms: document.getElementById('terms')
};

function render() {
    const items = CartManager.items;
    if (items.length === 0) {
        window.location.href = '/products.html';
        return;
    }

    EL.itemList.innerHTML = items.map(item => `
        <div class="flex items-center gap-5 group">
            <div class="relative shrink-0">
                <img src="${item.image}" class="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                <span class="absolute -top-2 -right-2 w-6 h-6 bg-zinc-900 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">${item.quantity}</span>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-[13px] font-black uppercase text-text truncate tracking-tight">${item.name}</h4>
                <p class="text-[11px] font-bold text-text-muted mt-0.5">${item.price.toFixed(2)} ₼</p>
            </div>
            <span class="font-black text-sm whitespace-nowrap">${(item.price * item.quantity).toFixed(2)} ₼</span>
        </div>
    `).join('');

    EL.total.innerText = `${CartManager.getTotal().toFixed(2)}`;
    if (EL.count) EL.count.innerText = items.reduce((s, i) => s + i.quantity, 0);
}

function handleCopy() {
    if (!EL.cardNum) return;
    const num = EL.cardNum.innerText.replace(/\s/g, '');
    navigator.clipboard.writeText(num).then(() => {
        const originalIcon = EL.copyBtn.innerHTML;
        EL.copyBtn.innerHTML = '<i class="ri-check-line text-green-400"></i>';
        setTimeout(() => {
            EL.copyBtn.innerHTML = originalIcon;
        }, 2000);
    });
}

function handleComplete() {
    if (!EL.firstName.value || !EL.lastName.value || !EL.contact.value) {
        alert('Hörmətli müştəri, xahiş edirik bütün məlumatları doldurun.');
        return;
    }

    if (!EL.terms.checked) {
        alert('Davam etmək üçün istifadəçi razılaşmasını qəbul etməlisiniz.');
        return;
    }

    // Prepare WhatsApp message
    const orderDetails = CartManager.items.map(i => `${i.name} (${i.quantity} ədəd) - ${i.price * i.quantity} ₼`).join('%0A');
    const message = `YENİ SİFARİŞ! 🎮%0A%0AAd: ${EL.firstName.value}%0ASoyad: ${EL.lastName.value}%0AƏlaqə: ${EL.contact.value}%0A%0AMəhsullar:%0A${orderDetails}%0A%0ACəmi: ${CartManager.getTotal().toFixed(2)} ₼`;

    // Clear cart and redirect to WhatsApp
    localStorage.removeItem('cart');
    window.open(`https://wa.me/994500000000?text=${message}`, '_blank');
    alert('Sifarişiniz qeydə alındı! WhatsApp-a yönləndirilirsiniz.');
    window.location.href = '/';
}

function init() {
    initTransitions();
    render();
    if (EL.btn) EL.btn.onclick = handleComplete;
    if (EL.copyBtn) EL.copyBtn.onclick = handleCopy;
}

document.addEventListener('DOMContentLoaded', init);
