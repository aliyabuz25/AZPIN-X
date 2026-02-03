import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    server: {
        proxy: {
            '/api': 'http://localhost:5174',
            '/uploads': 'http://localhost:5174'
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                admin: 'pin-admin.html',
                products: 'products.html',
                catalog: 'catalog.html',
                checkout: 'checkout.html',
                contact: 'contact.html',
                about: 'about.html',
                faq: 'faq.html',
                terms: 'terms.html',
                privacy: 'privacy.html',
                refund: 'refund.html',
                confirm: 'confirm.html',
                authWait: 'auth-wait.html'
            }
        }
    }
})
