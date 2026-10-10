import type { Db } from '@/server/db/supabase'

// Signing in (GLOSSARY.md: Seller, Display Name). These act on the client passed in: from a
// server action it is the request's cookie client (@/server/db/request-client), so signing in
// or out writes the session cookies. See docs/documents/sign-in.md.

/** The signed-in Seller, as the header shows them. */
export type Seller = {
  id: string
  displayName: string
  /** Their Discord avatar, or null when they have no Discord identity. */
  discordAvatarUrl: string | null
}

export type SignUpInput = {
  email: string
  password: string
  displayName: string
}

// Signing in or up failed. The message is Thai and is shown to the visitor as is.
export class SignInError extends Error {
  name = 'SignInError'
}

/** Passwords shorter than this are refused. supabase/config.toml enforces the same. */
export const MIN_PASSWORD_LENGTH = 8

const SHORT_PASSWORD = `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`
const WRONG_CREDENTIALS = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
const EMAIL_TAKEN = 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน'
const BAD_EMAIL = 'รูปแบบอีเมลไม่ถูกต้อง'
const TOO_MANY_TRIES = 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่'

// Supabase Auth error codes (AuthError.code) and the Thai message each becomes. Any other
// error is unexpected and is thrown as it is.
const MESSAGES: Record<string, string> = {
  invalid_credentials: WRONG_CREDENTIALS,
  user_already_exists: EMAIL_TAKEN,
  email_exists: EMAIL_TAKEN,
  weak_password: SHORT_PASSWORD,
  email_address_invalid: BAD_EMAIL,
  validation_failed: BAD_EMAIL,
  over_request_rate_limit: TOO_MANY_TRIES,
  over_email_send_rate_limit: TOO_MANY_TRIES,
}

function rejectAuthError(error: { code?: string }): never {
  const message = error.code && MESSAGES[error.code]
  if (message) throw new SignInError(message)
  throw error
}

function toEmail(email: string) {
  const trimmed = email.trim()
  if (trimmed === '') throw new SignInError('ต้องใส่อีเมล')
  return trimmed
}

/**
 * Makes a new Seller and signs them in. No email confirmation: the account works at once.
 * The database makes the Seller's profile and starting Cost Categories (create_seller).
 */
export async function signUpWithEmail(db: Db, input: SignUpInput): Promise<void> {
  const displayName = input.displayName.trim()
  if (displayName === '') throw new SignInError('ต้องใส่ชื่อที่แสดง')
  const email = toEmail(input.email)
  // Not trimmed: spaces are part of a password.
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new SignInError(SHORT_PASSWORD)

  const { error } = await db.auth.signUp({
    email,
    password: input.password,
    options: { data: { display_name: displayName } },
  })
  if (error) rejectAuthError(error)
}

/** Signs a Seller in with their email and password. */
export async function signInWithEmail(db: Db, email: string, password: string): Promise<void> {
  const address = toEmail(email)
  if (password === '') throw new SignInError('ต้องใส่รหัสผ่าน')
  const { error } = await db.auth.signInWithPassword({ email: address, password })
  if (error) rejectAuthError(error)
}

/** Ends this session. */
export async function signOut(db: Db): Promise<void> {
  const { error } = await db.auth.signOut({ scope: 'local' })
  if (error) throw error
}

/** The signed-in Seller, or null when no one is signed in. */
export async function currentSeller(db: Db): Promise<Seller | null> {
  // getClaims verifies the session's token; the cookie alone is not trusted.
  const { data: auth } = await db.auth.getClaims()
  const id = auth?.claims.sub
  if (!id) return null
  const [profile, avatar] = await Promise.all([
    db.from('seller_profile').select('id, display_name').eq('id', id).maybeSingle(),
    db.rpc('seller_discord_avatar'),
  ])
  if (profile.error) throw profile.error
  if (avatar.error) throw avatar.error
  const data = profile.data
  return data && { id: data.id, displayName: data.display_name, discordAvatarUrl: avatar.data ?? null }
}
