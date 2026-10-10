import type { UserIdentity } from '@supabase/supabase-js'
import { loginPath, safeReturnTo } from '@/lib/return-to'
import type { Db } from '@/server/db/supabase'

// Signing in with Discord, and binding Discord to a signed-in Seller from /me (OAuth with PKCE,
// run by Supabase Auth). See docs/documents/sign-in.md, "Signing in with Discord" and "Binding
// and unbinding ways to sign in".
//
// Both flows leave the site twice: to Discord through Supabase Auth, then back to the callback
// Route Handler (src/app/auth/callback/route.ts), which calls finishOAuth. The callback URL
// carries the page to return to (?next=) and which flow it was (?flow=), because a failure
// goes back to where the flow started: the login page for signing in, /me for binding. Both
// come from the visitor's browser, so neither is trusted for anything but where to go next.

/** The path of the OAuth callback Route Handler. */
export const CALLBACK_PATH = '/auth/callback'

/** The flows that come back through the callback. */
export type OAuthFlow = 'sign-in' | 'bind'

/** Why an OAuth flow came back without a session or a binding. Sent to the page as ?error=. */
export type OAuthFailure =
  | 'cancelled'
  | 'no_email'
  | 'unverified_email'
  | 'failed'
  /** Signing in: Supabase Auth attached the Discord account to an existing Seller by email. */
  | 'email_in_use'
  /** Binding: the Discord account is already bound to another Seller. */
  | 'discord_taken'
  /** Binding: the Discord account is already bound to this Seller. */
  | 'already_bound'

/** Where a successful bind returns to, so /me can say it worked. */
export const BIND_RETURN_TO = '/me?bound=discord'

const FAILURE_MESSAGES: Record<OAuthFlow, Partial<Record<OAuthFailure, string>>> = {
  'sign-in': {
    cancelled: 'ยกเลิกการเข้าสู่ระบบด้วย Discord แล้ว ลองอีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลแทน',
    no_email: 'บัญชี Discord นี้ไม่มีอีเมล เพิ่มอีเมลในบัญชี Discord ก่อน แล้วลองอีกครั้ง',
    unverified_email: 'อีเมลในบัญชี Discord นี้ยังไม่ได้ยืนยัน ยืนยันอีเมลใน Discord ก่อน แล้วลองอีกครั้ง',
    failed: 'เข้าสู่ระบบด้วย Discord ไม่สำเร็จ ลองอีกครั้ง',
    email_in_use:
      'อีเมลของบัญชี Discord นี้มีบัญชีอยู่แล้ว เข้าสู่ระบบด้วยอีเมลและรหัสผ่านก่อน แล้วผูก Discord ที่หน้าบัญชีของฉัน',
  },
  bind: {
    cancelled: 'ยกเลิกการผูก Discord แล้ว',
    no_email: 'บัญชี Discord นี้ไม่มีอีเมล เพิ่มอีเมลในบัญชี Discord ก่อน แล้วลองผูกอีกครั้ง',
    unverified_email: 'อีเมลในบัญชี Discord นี้ยังไม่ได้ยืนยัน ยืนยันอีเมลใน Discord ก่อน แล้วลองผูกอีกครั้ง',
    failed: 'ผูก Discord ไม่สำเร็จ ลองอีกครั้ง',
    discord_taken:
      'บัญชี Discord นี้ผูกกับบัญชีอื่นอยู่แล้ว ถ้าต้องการใช้กับบัญชีนี้ ให้ออกจากระบบ เข้าสู่ระบบด้วย Discord แล้วลบบัญชีนั้นที่หน้าบัญชีของฉัน จากนั้นกลับมาผูกที่บัญชีนี้อีกครั้ง ข้อมูลของสองบัญชีจะไม่ถูกรวมกัน',
    already_bound: 'บัญชี Discord นี้ผูกกับบัญชีนี้อยู่แล้ว',
  },
}

/**
 * The Thai message for an ?error= the callback sent back to the page `flow` started from, or
 * null for anything else.
 */
export function oauthFailureMessage(value: unknown, flow: OAuthFlow = 'sign-in'): string | null {
  const messages = FAILURE_MESSAGES[flow]
  if (typeof value !== 'string' || !Object.hasOwn(messages, value)) return null
  return messages[value as OAuthFailure] ?? null
}

/** The callback URL on the site at `origin`, for `flow`, returning to `returnTo` afterwards. */
export function oauthCallbackUrl(origin: string, flow: OAuthFlow, returnTo: string): string {
  const url = new URL(CALLBACK_PATH, origin)
  url.searchParams.set('flow', flow)
  url.searchParams.set('next', safeReturnTo(returnTo))
  return url.toString()
}

/**
 * Starts signing in with Discord. Returns the URL to send the visitor to. `db` must be able to
 * write cookies (a server action's request client): the PKCE code verifier is kept in one
 * until the callback. `origin` is this site's origin as the visitor sees it, so the callback
 * comes back to the host that holds that cookie.
 */
export async function startDiscordSignIn(db: Db, origin: string, returnTo: string): Promise<string> {
  const { data, error } = await db.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: oauthCallbackUrl(origin, 'sign-in', returnTo), skipBrowserRedirect: true },
  })
  if (error) throw error
  return data.url
}

/**
 * Starts binding Discord to the signed-in Seller (manual linking, `enable_manual_linking`).
 * Returns the URL to send them to; they come back to /me. `db` must be the signed-in Seller's
 * request client in a server action, as for startDiscordSignIn.
 */
export async function startDiscordBind(db: Db, origin: string): Promise<string> {
  const { data, error } = await db.auth.linkIdentity({
    provider: 'discord',
    options: { redirectTo: oauthCallbackUrl(origin, 'bind', BIND_RETURN_TO), skipBrowserRedirect: true },
  })
  if (error) throw error
  return data.url
}

// Supabase Auth's message when the provider gave no email (internal/api/external.go).
const NO_EMAIL = 'Error getting user email from external provider'
// Its message when binding a Discord account that another user has (internal/api/identity.go).
// The same error code without "to another user" means this user has it already.
const LINKED_TO_ANOTHER_USER = 'already linked to another user'

// What went wrong, from the error Supabase Auth (or Discord, through it) put on the callback.
function failureFrom(params: URLSearchParams): OAuthFailure {
  const code = params.get('error_code')
  const description = params.get('error_description') ?? ''
  if (code === 'identity_already_exists') {
    return description.includes(LINKED_TO_ANOTHER_USER) ? 'discord_taken' : 'already_bound'
  }
  if (code === 'provider_email_needs_verification') return 'unverified_email'
  // Discord's answer when the visitor presses Cancel on its consent screen. Supabase Auth
  // passes it on with no error_code of its own.
  if (params.get('error') === 'access_denied' && !code) return 'cancelled'
  if (description.includes(NO_EMAIL)) return 'no_email'
  return 'failed'
}

const FLOWS: readonly OAuthFlow[] = ['sign-in', 'bind']

// An unknown or missing ?flow= is treated as signing in.
function flowOf(params: URLSearchParams): OAuthFlow {
  return FLOWS.find((flow) => flow === params.get('flow')) ?? 'sign-in'
}

function failurePath(flow: OAuthFlow, returnTo: string, failure: OAuthFailure): string {
  switch (flow) {
    case 'sign-in':
      return `${loginPath(returnTo)}&error=${failure}`
    case 'bind':
      return `/me?error=${failure}`
  }
}

// The Seller the verified session in `db` names, or null.
async function sessionSellerId(db: Db): Promise<string | null> {
  const { data } = await db.auth.getClaims()
  return data?.claims.sub ?? null
}

/**
 * Finishes an OAuth flow at the callback, given the callback's query. On success the session
 * is in `db`'s cookies (it must be able to write them: the Route Handler's request client).
 * Returns the path on this site to redirect to: the return-to page, or, on failure, the page
 * the flow started from with ?error= set to an OAuthFailure.
 *
 * A sign-in that Supabase Auth finished by attaching the Discord account to an existing Seller
 * with the same email is refused (refuseAutomaticLink): the visitor is signed out and sent to
 * the login page with ?error=email_in_use.
 */
export async function finishOAuth(db: Db, params: URLSearchParams): Promise<string> {
  const flow = flowOf(params)
  const returnTo = safeReturnTo(params.get('next'))
  if (params.has('error')) return failurePath(flow, returnTo, failureFrom(params))

  const code = params.get('code')
  if (!code) return failurePath(flow, returnTo, 'failed')
  // Who was signed in before this flow: when binding, the Seller who started it at /me.
  const before = await sessionSellerId(db)
  const { error } = await db.auth.exchangeCodeForSession(code)
  if (error) {
    // Most often the code verifier cookie is missing: the flow started on another host
    // (localhost rather than 127.0.0.1) or in another browser, or the code was already used.
    console.warn(`OAuth code exchange failed: ${error.code ?? ''} ${error.message}`)
    return failurePath(flow, returnTo, 'failed')
  }
  // Checked whatever ?flow= says: the visitor can change it.
  if (await refuseAutomaticLink(db, before)) return `${loginPath(returnTo)}&error=email_in_use`
  return returnTo
}

// How long after Supabase Auth attaches an identity its session can still be handed out: the
// PKCE auth code lives 5 minutes (FlowStateExpiryDuration), with room to spare.
const JUST_NOW_MS = 10 * 60 * 1000
// A first sign-in inserts the user and the identity in one transaction, milliseconds apart.
const SAME_TRANSACTION_MS = 10 * 1000
// Supabase Auth writes created_at and updated_at together when it inserts an identity, and
// moves updated_at on at every later sign-in with it.
const UNTOUCHED_MS = 1000

/**
 * Supabase Auth links identities by email on its own: a first Discord sign-in whose email
 * matches an existing user is attached to that user (DetermineAccountLinking in supabase/auth
 * internal/models/linking.go), and with email confirmations off it trusts even an unverified
 * Discord email. That would let anyone who puts a Seller's email on a Discord account sign in
 * as that Seller. Binding at /me is the only way Discord may join an existing Seller.
 *
 * So after the code exchange, when `db`'s new session belongs to a Seller who was not already
 * signed in before the flow (`signedInBefore`, the Seller id from before the exchange, or null),
 * and that Seller has a Discord identity Supabase Auth inserted just now, untouched since, on a
 * user it did not insert with it, the identity is unlinked with the Seller's own session and the
 * session is signed out. Returns true when it refused.
 *
 * - A first Discord sign-in: the user and identity were inserted together. Allowed.
 * - A later Discord sign-in: the identity is old, or updated_at moved on. Allowed.
 * - Binding at /me: the same Seller was signed in before. Allowed.
 */
export async function refuseAutomaticLink(db: Db, signedInBefore: string | null): Promise<boolean> {
  const { data: claims } = await db.auth.getClaims()
  if (!claims) return false
  const { data, error } = await db.auth.getUser()
  if (error) throw error
  const { user } = data
  if (user.id === signedInBefore) return false

  // Supabase Auth's clock: when it issued this session.
  const issuedAt = claims.claims.iat * 1000
  const userCreated = Date.parse(user.created_at)
  const attached = (user.identities ?? []).filter((identity) => {
    if (identity.provider !== 'discord' || !identity.created_at || !identity.updated_at) return false
    const created = Date.parse(identity.created_at)
    return (
      created >= issuedAt - JUST_NOW_MS &&
      Math.abs(Date.parse(identity.updated_at) - created) < UNTOUCHED_MS &&
      created - userCreated > SAME_TRANSACTION_MS
    )
  })
  if (attached.length === 0) return false

  try {
    for (const identity of attached) await unlink(db, identity)
  } finally {
    // Signed out even if unlinking failed; that failure is then thrown.
    await db.auth.signOut({ scope: 'local' })
  }
  console.warn(`Refused a Discord sign-in that Supabase Auth linked by email to Seller ${user.id}`)
  return true
}

async function unlink(db: Db, identity: UserIdentity) {
  const { error } = await db.auth.unlinkIdentity(identity)
  if (error) throw error
}
