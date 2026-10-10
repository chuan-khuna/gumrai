import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/server/database.types'

// The Supabase client every operation in src/server/ takes as its first argument. Operations
// never make one: the caller decides whose client it is.
export type Db = SupabaseClient<Database>

// The only place a Supabase client is made. Everything under src/server/ is server-side
// business rules, kept apart from the UI (ADR 0001); pages and components never import
// this file. They get their client from requestClient (@/server/request-client).
//
// It uses the secret key because there is no login yet. When login lands, pages and actions
// get a per-request client carrying the seller's session instead, and this stays for tests
// and admin-only work.
export function createServerClient(): Db {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set. Copy .env.example to .env.local.')
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}
