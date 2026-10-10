import { randomUUID } from 'node:crypto'
import { createPublicClient, createSecretClient, type Db } from '@/server/db/supabase'

// Test-only: real Sellers in the local Supabase, for tests that call operations as a Seller.
// Not a mock: each one is an auth user made with the admin API, then signed in with email
// and password like anyone else, so row-level security applies to everything it does.

export type TestSeller = {
  id: string
  email: string
  password: string
  /** A client signed in as this Seller. Pass it to operations as their `db`. */
  db: Db
}

const admin = createSecretClient()
// Every Seller this test file has made and not yet removed.
const made: string[] = []

/** A new Seller, signed in. Remove it with removeSellers, usually in afterEach. */
export async function createSeller(displayName = 'ผู้ขายทดสอบ'): Promise<TestSeller> {
  const email = `seller-${randomUUID()}@gumrai.test`
  const password = `test-${randomUUID()}`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error) throw error
  made.push(data.user.id)
  return { id: data.user.id, email, password, db: await signIn(email, password) }
}

/** A fresh client signed in with this email and password. */
export async function signIn(email: string, password: string): Promise<Db> {
  const db = createPublicClient()
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  return db
}

/** Records a Seller made some other way (a sign-up test), so removeSellers removes it too. */
export function trackSeller(id: string): void {
  made.push(id)
}

/**
 * Deletes every Seller this file has made. Deleting the auth user deletes their profile and
 * everything they own (each owner column cascades), so tests need no other cleanup.
 */
export async function removeSellers(): Promise<void> {
  for (const id of made.splice(0)) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error && error.status !== 404) throw error
  }
}

/** The secret-key client, for a test that must look past row-level security. */
export function adminClient(): Db {
  return admin
}
