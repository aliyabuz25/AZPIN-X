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
                main: 'index.html'
            }
        }
    }
})
