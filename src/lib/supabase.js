import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY

// Safety check to avoid blank screen if env vars are missing
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseUrl.startsWith('$')) {
  console.error('Supabase credentials missing or invalid. Check environment variables.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
