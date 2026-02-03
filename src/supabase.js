import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qmrchngwatxrnnkklfwa.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FHdYeBLA59RTUx1SVtbBrQ__L35Ax02'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
