/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './products.html',
    './checkout.html',
    './confirm.html',
    './auth-wait.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        bg: 'var(--bg)',
        'header-bg': 'var(--header-bg)'
      }
    }
  },
  plugins: []
}
