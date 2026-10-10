import { MIN_PASSWORD_LENGTH } from '@/server/auth/auth'
import { createPublicClient, type Db } from '@/server/db/supabase'

// The signed-in Seller's own account, as /me shows and changes it (GLOSSARY.md: Seller,
// Display Name). Every operation acts on the Seller whose session `db` holds; from a server
// action that is the request's cookie client. See docs/documents/sign-in.md.

/** What /me shows about the signed-in Seller. */
export type Account = {
  id: string
  /** The email they sign in with, or null if Supabase Auth has none for them. */
  email: string | null
  displayName: string
  /**
   * Whether they can sign in with email and password. A Seller who only signed in with
   * Discord has no password until they set one.
   */
  hasPassword: boolean
}

// Changing the account failed. The message is Thai and is shown to the Seller as is.
export class AccountError extends Error {
  name = 'AccountError'
}

const SHORT_PASSWORD = `รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`
const WRONG_PASSWORD = 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
const SAME_PASSWORD = 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'
const TOO_MANY_TRIES = 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่'
const NOT_SIGNED_IN = 'ต้องเข้าสู่ระบบก่อน'

// Supabase Auth error codes (AuthError.code) and the Thai message each becomes. Any other
// error is unexpected and is thrown as it is.
const MESSAGES: Record<string, string> = {
  invalid_credentials: WRONG_PASSWORD,
  same_password: SAME_PASSWORD,
  weak_password: SHORT_PASSWORD,
  over_request_rate_limit: TOO_MANY_TRIES,
}

function rejectAuthError(error: { code?: string }): never {
  const message = error.code && MESSAGES[error.code]
  if (message) throw new AccountError(message)
  throw error
}

// The verified session's Seller id and email. getClaims checks the token; the cookie alone is
// not trusted.
async function session(db: Db): Promise<{ id: string; email: string | null } | null> {
  const { data } = await db.auth.getClaims()
  const id = data?.claims.sub
  if (!id) return null
  const email = data.claims.email
  return { id, email: typeof email === 'string' && email !== '' ? email : null }
}

async function signedIn(db: Db) {
  const seller = await session(db)
  if (!seller) throw new AccountError(NOT_SIGNED_IN)
  return seller
}

async function hasPassword(db: Db): Promise<boolean> {
  const { data, error } = await db.rpc('seller_has_password')
  if (error) throw error
  return data
}

function checkNewPassword(password: string) {
  // Not trimmed: spaces are part of a password.
  if (password.length < MIN_PASSWORD_LENGTH) throw new AccountError(SHORT_PASSWORD)
}

async function savePassword(db: Db, password: string) {
  const { error } = await db.auth.updateUser({ password })
  if (error) rejectAuthError(error)
}

/** The signed-in Seller's account, or null when no one is signed in. */
export async function readAccount(db: Db): Promise<Account | null> {
  const seller = await session(db)
  if (!seller) return null
  const { data, error } = await db
    .from('seller_profile')
    .select('id, display_name')
    .eq('id', seller.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    email: seller.email,
    displayName: data.display_name,
    hasPassword: await hasPassword(db),
  }
}

/** Changes the Seller's Display Name, trimmed. Returns the name as saved. */
export async function renameDisplayName(db: Db, displayName: string): Promise<string> {
  const name = displayName.trim()
  if (name === '') throw new AccountError('ต้องใส่ชื่อที่แสดง')
  const { id } = await signedIn(db)
  const { data, error } = await db
    .from('seller_profile')
    .update({ display_name: name })
    .eq('id', id)
    .select('display_name')
    .single()
  if (error) throw error
  return data.display_name
}

/**
 * Changes the password of a Seller who has one. The current password must be right; the new
 * one must be at least MIN_PASSWORD_LENGTH long and differ from it. The Seller's other
 * sessions are signed out by Supabase Auth; this one stays signed in.
 */
export async function changePassword(db: Db, currentPassword: string, newPassword: string): Promise<void> {
  if (currentPassword === '') throw new AccountError('ต้องใส่รหัสผ่านปัจจุบัน')
  checkNewPassword(newPassword)
  const { email } = await signedIn(db)
  if (!email || !(await hasPassword(db))) {
    throw new AccountError('บัญชีนี้ยังไม่มีรหัสผ่าน ตั้งรหัสผ่านแทน')
  }

  // Check the current password by signing in with it on a throwaway client, so the request's
  // own session is left alone, then end that extra session at once.
  const check = createPublicClient()
  const { error } = await check.auth.signInWithPassword({ email, password: currentPassword })
  if (error) rejectAuthError(error)
  await check.auth.signOut({ scope: 'local' })

  await savePassword(db, newPassword)
}

/**
 * Sets a first password for a Seller who has none (they only signed in with Discord). No
 * current password is asked for. Afterwards they can also sign in with their email and this
 * password.
 */
export async function setFirstPassword(db: Db, newPassword: string): Promise<void> {
  checkNewPassword(newPassword)
  const { email } = await signedIn(db)
  if (!email) throw new AccountError('บัญชีนี้ไม่มีอีเมล จึงตั้งรหัสผ่านไม่ได้')
  if (await hasPassword(db)) {
    throw new AccountError('บัญชีนี้มีรหัสผ่านอยู่แล้ว เปลี่ยนรหัสผ่านแทน')
  }
  await savePassword(db, newPassword)
}
