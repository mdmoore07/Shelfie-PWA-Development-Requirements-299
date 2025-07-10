import { createClient } from '@supabase/supabase-js'

// Supabase credentials
const SUPABASE_URL = 'https://wsoiurskofxvoebzzsgu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzb2l1cnNrb2Z4dm9lYnp6c2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxODU1NDUsImV4cCI6MjA2Nzc2MTU0NX0.C9YVsJLHWsz9wmOgJc1PWhBlr3PG31wiNrQTZWoPmMM'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials')
}

// Create a single supabase client for interacting with your database
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'shelfie-auth-storage'
  }
})

export default supabase