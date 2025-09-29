import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string || "https://mpxebbqxqyzalctgsyxm.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGViYnF4cXl6YWxjdGdzeXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjAxNjksImV4cCI6MjA3NDA5NjE2OX0.dSQ9q5KN3p2Ix2lZBdNs8CE3P3c1eiv-7BWzSBfB1j8"

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

if (!isSupabaseConfigured) {
  console.error('[Supabase] Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  console.error('[Supabase] Authentication and payment features will be disabled.')
}

// Export supabase client only when properly configured
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null