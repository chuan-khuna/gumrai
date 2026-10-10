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
  /**
   * Signing in: the Discord account's email belongs to an existing Seller, and the database
   * refused Supabase Auth's automatic linking by email.
   */
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

// Classifying the error Supabase Auth (or Discord, through it) put on the callback. The
// error_code values are Supabase Auth's own (internal/api/apierrors/errorcode.go) and are
// matched first. Where it sends none, or one too broad to say what happened, the description is
// matched instead. That is a fallback: a reworded message in a new Supabase Auth version turns
// the failure into 'failed', never into a success, and the tests pin each one.

/**
 * The message of the error the database raises when Supabase Auth tries to link a Discord
 * account to an existing Seller by email (refuse_automatic_link,
 * supabase/migrations/20261010090815_refuse_automatic_linking.sql). Supabase Auth passes it on as
 * ?error=access_denied&error_description=automatic_link_refused, with no error_code.
 */
export const AUTOMATIC_LINK_REFUSED = 'automatic_link_refused'
// Fallback: the no-email error carries only the generic error_code unexpected_failure
// (internal/api/external.go).
const NO_EMAIL = 'Error getting user email from external provider'
// Fallback: identity_already_exists covers both "Identity is already linked" (to this user)
// and "Identity is already linked to another user" (internal/api/identity.go).
const LINKED_TO_ANOTHER_USER = 'already linked to another user'

function failureFrom(flow: OAuthFlow, params: URLSearchParams): OAuthFailure {
  const code = params.get('error_code')
  const description = params.get('error_description') ?? ''
  if (code === 'identity_already_exists') {
    return description.includes(LINKED_TO_ANOTHER_USER) ? 'discord_taken' : 'already_bound'
  }
  if (code === 'provider_email_needs_verification') return 'unverified_email'
  // Our own message, matched exactly. A bind is refused this way only if Supabase Auth stopped
  // marking the bind's flow state, so on /me it is a plain failure.
  if (!code && description === AUTOMATIC_LINK_REFUSED) return flow === 'sign-in' ? 'email_in_use' : 'failed'
  // Discord's answer when the visitor presses Cancel on its consent screen. Supabase Auth
  // passes it on with no error_code of its own.
  if (params.get('error') === 'access_denied' && !code) return 'cancelled'
  if (description.includes(NO_EMAIL)) return 'no_email'
  return 'failed'
}

const FLOWS: readonly OAuthFlow[] = ['sign-in', 'bind']

// An unknown or missing ?flow= is treated as signing in. It only picks where to go next.
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

/**
 * Finishes an OAuth flow at the callback, given the callback's query. On success the session
 * is in `db`'s cookies (it must be able to write them: the Route Handler's request client).
 * Returns the path on this site to redirect to: the return-to page, or, on failure, the page
 * the flow started from with ?error= set to an OAuthFailure.
 *
 * Nothing here decides whether a link is allowed. A Discord sign-in that Supabase Auth tried to
 * attach to an existing Seller by email comes back with no code: the database refused the link,
 * so no identity, code or session was made, and the error becomes email_in_use.
 */
export async function finishOAuth(db: Db, params: URLSearchParams): Promise<string> {
  const flow = flowOf(params)
  const returnTo = safeReturnTo(params.get('next'))
  if (params.has('error')) return failurePath(flow, returnTo, failureFrom(flow, params))

  const code = params.get('code')
  if (!code) return failurePath(flow, returnTo, 'failed')
  const { error } = await db.auth.exchangeCodeForSession(code)
  if (error) {
    // Most often the code verifier cookie is missing: the flow started on another host
    // (localhost rather than 127.0.0.1) or in another browser, or the code was already used.
    // No session was made. A Seller who was already signed in (binding from /me) stays so.
    console.warn(`OAuth code exchange failed: ${error.code ?? ''} ${error.message}`)
    return failurePath(flow, returnTo, 'failed')
  }
  return returnTo
}
