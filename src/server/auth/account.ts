import { randomUUID } from 'node:crypto'
import { MIN_PASSWORD_LENGTH, sessionSeller } from '@/server/auth/auth'
import { createPublicClient, createSecretClient, type Db } from '@/server/db/supabase'

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
const NO_CURRENT_PASSWORD = 'ต้องใส่รหัสผ่านปัจจุบัน'

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

async function signedIn(db: Db) {
  const seller = await sessionSeller(db)
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
  const seller = await sessionSeller(db)
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
  if (currentPassword === '') throw new AccountError(NO_CURRENT_PASSWORD)
  checkNewPassword(newPassword)
  const { email } = await signedIn(db)
  if (!email || !(await hasPassword(db))) {
    throw new AccountError('บัญชีนี้ยังไม่มีรหัสผ่าน ตั้งรหัสผ่านแทน')
  }
  await checkCurrentPassword(email, currentPassword)
  await savePassword(db, newPassword)
}

// Checks the current password by signing in with it on a throwaway client, so the request's
// own session is left alone, then ends that extra session at once. Supabase Auth rate-limits
// these sign-ins. This is the app asking again, not Supabase Auth: with secure_password_change
// off, Supabase Auth itself changes a password on the session alone (docs/documents/sign-in.md,
// "Risks and decisions").
async function checkCurrentPassword(email: string, password: string) {
  if (password === '') throw new AccountError(NO_CURRENT_PASSWORD)
  const check = createPublicClient()
  const { error } = await check.auth.signInWithPassword({ email, password })
  if (error) rejectAuthError(error)
  await check.auth.signOut({ scope: 'local' })
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

/**
 * Gives the signed-in Seller a new random avatar seed, so their generated avatar pattern
 * changes. Returns the new seed.
 */
export async function shuffleAvatarPattern(db: Db): Promise<string> {
  const { id } = await signedIn(db)
  const { data, error } = await db
    .from('seller_profile')
    .update({ avatar_seed: randomUUID() })
    .eq('id', id)
    .select('avatar_seed')
    .single()
  if (error) throw error
  return data.avatar_seed
}

/** What deleting the account would lose, for the confirmation /me shows. */
export type AccountData = { costSheets: number; costItems: number }

/** How many Cost Sheets and Cost Items the signed-in Seller has. */
export async function countAccountData(db: Db): Promise<AccountData> {
  await signedIn(db)
  // Row-level security limits both counts to the Seller's own rows.
  const [sheets, items] = await Promise.all([
    db.from('cost_sheet').select('id', { count: 'exact', head: true }),
    db.from('cost_item').select('id', { count: 'exact', head: true }),
  ])
  if (sheets.error) throw sheets.error
  if (items.error) throw items.error
  return { costSheets: sheets.count ?? 0, costItems: items.count ?? 0 }
}

/** The text a Seller must type, exactly, to delete their account. */
export const DELETE_CONFIRMATION = 'delete'

/**
 * Deletes the signed-in Seller and everything they own: profile, Cost Categories, Cost Items,
 * Cost Sheets and their lines. Refused unless `confirmation` is exactly DELETE_CONFIRMATION.
 * Afterwards `db`'s session is cleared, so the Seller is signed out.
 *
 * Deleting an auth user is admin-only, so this is the one operation outside tests that uses
 * the secret key. It deletes only the id the verified session names.
 */
export async function deleteAccount(db: Db, confirmation: string): Promise<void> {
  if (confirmation !== DELETE_CONFIRMATION) {
    throw new AccountError(`พิมพ์ ${DELETE_CONFIRMATION} เพื่อยืนยันการลบบัญชี`)
  }
  const { id } = await signedIn(db)

  // The delete_seller_sheets trigger deletes the sheets and lines first; the owner keys
  // cascade to the profile, categories and items (docs/documents/data-model.md).
  const { error } = await createSecretClient().auth.admin.deleteUser(id)
  if (error) throw error

  // The user and their sessions are already gone, and signOut ignores Supabase Auth's 404 or
  // 403 for that; it still clears the session, and on a request client the cookies.
  await db.auth.signOut({ scope: 'local' })
}

/**
 * A way the Seller can sign in. `email` is email and password: the Seller has a password (a
 * password set later adds no `email` identity, so the identities cannot say). `discord` is a
 * Discord account bound to them: a `discord` identity.
 */
export type SignInMethod = 'email' | 'discord'

const LAST_METHOD = 'ต้องเหลือวิธีเข้าสู่ระบบอย่างน้อยหนึ่งวิธี จึงเลิกใช้วิธีนี้ไม่ได้'

async function identities(db: Db) {
  const { data, error } = await db.auth.getUserIdentities()
  if (error) throw error
  return data.identities
}

/** The ways the signed-in Seller can sign in, email and password first. */
export async function listSignInMethods(db: Db): Promise<SignInMethod[]> {
  await signedIn(db)
  const [password, bound] = await Promise.all([hasPassword(db), identities(db)])
  const methods: SignInMethod[] = []
  if (password) methods.push('email')
  if (bound.some((identity) => identity.provider === 'discord')) methods.push('discord')
  return methods
}

/**
 * Stops the Seller signing in with `method`. Refused when it is not one of their ways to sign
 * in, or when it is the only one left (deleting the account is how to drop the last one).
 *
 * - `discord`: unlinks the Discord identity (Supabase Auth's unlinkIdentity). Supabase Auth
 *   refuses to unlink a user's only identity, which is the case for a Seller who signed up with
 *   Discord and set a password later, so their `email` identity is added first
 *   (seller_add_email_identity).
 * - `email`: clears the password (seller_clear_password), once `currentPassword` is shown to be
 *   right, as for changePassword. Setting a password again binds it back.
 */
export async function unbindSignInMethod(db: Db, method: SignInMethod, currentPassword = ''): Promise<void> {
  const methods = await listSignInMethods(db)
  if (!methods.includes(method)) throw new AccountError('บัญชีนี้ไม่ได้ใช้วิธีนี้เข้าสู่ระบบ')
  if (methods.length === 1) throw new AccountError(LAST_METHOD)

  if (method === 'email') {
    const { email } = await signedIn(db)
    if (!email) throw new AccountError('บัญชีนี้ไม่มีอีเมล')
    await checkCurrentPassword(email, currentPassword)
    const { error } = await db.rpc('seller_clear_password')
    if (error) throw error
    return
  }

  if ((await identities(db)).length === 1) {
    const { error } = await db.rpc('seller_add_email_identity')
    if (error) throw error
  }
  for (const identity of await identities(db)) {
    if (identity.provider !== 'discord') continue
    const { error } = await db.auth.unlinkIdentity(identity)
    if (error) rejectAuthError(error)
  }
}
