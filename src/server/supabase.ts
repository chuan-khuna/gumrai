import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/server/database.types'

// The Supabase client every operation in src/server/ takes as its first argument. Operations
// never make one: the caller decides whose client it is.
export type Db = SupabaseClient<Database>

// The only file that makes a Supabase client. Everything under src/server/ is server-side
// business rules, kept apart from the UI (ADR 0001); pages and components never import
// this file. They get their client from requestClient (@/server/request-client).

function setting(name: 'SUPABASE_URL' | 'SUPABASE_PUBLISHABLE_KEY' | 'SUPABASE_SECRET_KEY') {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set. Copy .env.example to .env.local.`)
  return value
}

/**
 * A client acting as whoever its cookies say is signed in, or as nobody (the anon role).
 * Row-level security limits it to that Seller's rows. Made fresh for every request.
 */
export function createSessionClient(cookies: CookieMethodsServer): Db {
  return createServerClient<Database>(setting('SUPABASE_URL'), setting('SUPABASE_PUBLISHABLE_KEY'), {
    cookies,
  })
}

/**
 * A client with no cookies, for signing in outside a request (tests). It holds its session
 * in memory once signed in.
 */
export function createPublicClient(): Db {
  return createClient<Database>(setting('SUPABASE_URL'), setting('SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * The secret-key client. It has the service_role, which bypasses row-level security, so it
 * sees every Seller's rows. Only tests and admin-only operations (creating or deleting an
 * auth user) use it; nothing a Seller does runs through it.
 */
export function createSecretClient(): Db {
  return createClient<Database>(setting('SUPABASE_URL'), setting('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
