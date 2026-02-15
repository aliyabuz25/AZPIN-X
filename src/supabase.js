const API_URL = '/api'

const getAuthHeaders = () => {
    const token = localStorage.getItem('azpin_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const authListeners = new Set()

export const supabase = {
    auth: {
        async signInWithPassword({ email, password }) {
            try {
                const r = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                const d = await r.json()
                if (!r.ok) throw new Error(d.error || 'Login failed')
                localStorage.setItem('azpin_token', d.token)
                const session = { access_token: d.token, user: d.user }
                authListeners.forEach(fn => fn('SIGNED_IN', session))
                return { data: { user: d.user, session }, error: null }
            } catch (e) {
                return { data: null, error: e }
            }
        },
        async signUp({ email, password }) {
            try {
                const r = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                const d = await r.json()
                if (!r.ok) throw new Error(d.error || 'Registration failed')
                localStorage.setItem('azpin_token', d.token)
                const session = { access_token: d.token, user: d.user }
                authListeners.forEach(fn => fn('SIGNED_UP', session))
                return { data: { user: d.user, session }, error: null }
            } catch (e) {
                return { data: null, error: e }
            }
        },
        async signOut() {
            localStorage.removeItem('azpin_token')
            authListeners.forEach(fn => fn('SIGNED_OUT', null))
            window.location.reload()
            return { error: null }
        },
        async getUser() {
            const token = localStorage.getItem('azpin_token')
            if (!token) return { data: { user: null }, error: null }
            try {
                const r = await fetch(`${API_URL}/auth/me`, {
                    headers: getAuthHeaders()
                })
                const d = await r.json()
                if (!r.ok) throw new Error(d.error)
                return { data: { user: d.user }, error: null }
            } catch (e) {
                return { data: { user: null }, error: e }
            }
        },
        onAuthStateChange(fn) {
            authListeners.add(fn)
            this.getUser().then(({ data }) => {
                if (data.user) fn('INITIAL_SESSION', { user: data.user })
            })
            return { data: { subscription: { unsubscribe: () => authListeners.delete(fn) } } }
        },
        async updateUser(data) {
            try {
                const r = await fetch(`${API_URL}/profile/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(data.data)
                })
                const d = await r.json()
                return { data: d, error: r.ok ? null : { message: d.error } }
            } catch (e) { return { data: null, error: e } }
        }
    },
    from(table) {
        return {
            _table: table,
            _filters: {},
            // _order: null, // Removed as per instruction's implied change
            // _limit: null, // Removed as per instruction's implied change
            // _single: false, // Removed as per instruction's implied change

            select(fields) { return this },
            eq(field, value) { this._filters[field] = value; return this },
            in(field, values) { this._filters[field] = values; return this },
            order(field, opts) { /* this._order = { field, ...opts }; */ return this }, // Modified
            limit(val) { /* this._limit = val; */ return this }, // Modified
            single() { /* this._single = true; */ return this }, // Modified
            maybeSingle() { return this }, // Added

            async insert(data) {
                if (this._table === 'orders') {
                    try {
                        const r = await fetch(`${API_URL}/orders`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                            body: JSON.stringify(data)
                        })
                        const d = await r.json()
                        return { data: d.order, error: r.ok ? null : { message: d.error } }
                    } catch (e) { return { data: null, error: e } }
                }
                return { data: null, error: null }
            },

            async upsert(data) {
                if (this._table === 'profiles') {
                    try {
                        const r = await fetch(`${API_URL}/profile/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                            body: JSON.stringify(data)
                        })
                        const d = await r.json()
                        return { data: d, error: r.ok ? null : { message: d.error } }
                    } catch (e) { return { data: null, error: e } }
                }
                return { data: null, error: null }
            },

            async update(data) {
                if (this._table === 'orders') {
                    const id = this._filters.id
                    try {
                        const r = await fetch(`${API_URL}/orders/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                            body: JSON.stringify(data)
                        })
                        const d = await r.json()
                        return { data: d, error: r.ok ? null : { message: d.error } }
                    } catch (e) { return { data: null, error: e } }
                }
                return { data: null, error: null }
            },

            async then(resolve) {
                // Handle complex queries as a thenable
                if (this._table === 'orders') {
                    try {
                        const r = await fetch(`${API_URL}/orders`, {
                            headers: getAuthHeaders()
                        })
                        const d = await r.json()
                        resolve({ data: d.orders, error: r.ok ? null : { message: d.error } })
                    } catch (e) { resolve({ data: null, error: e }) }
                } else {
                    resolve({ data: [], error: null })
                }
            }
        }
    },
    channel() {
        return {
            on() { return this },
            subscribe() { return this }
        }
    }
}
