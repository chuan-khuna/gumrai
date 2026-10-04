import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/server/database.types'

// The only place a Supabase client is made. Everything under src/server/ is server-side
// business rules, kept apart from the UI (ADR 0001); pages and components never import
// this file, only the operations beside it.
//
// It uses the secret key because there is no login yet. When Discord login lands, this
// becomes a per-request client carrying the seller's session, and RLS does the rest.
export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set. Copy .env.example to .env.local.')
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}
