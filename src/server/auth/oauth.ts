import { loginPath, safeReturnTo } from '@/lib/return-to'
import type { Db } from '@/server/db/supabase'

// Signing in through Discord (OAuth with PKCE, run by Supabase Auth). See
// docs/documents/sign-in.md, "Signing in with Discord".
//
// The flow leaves the site twice: to Discord through Supabase Auth, then back to the callback
// Route Handler (src/app/auth/callback/route.ts), which calls finishOAuth. The callback URL
// carries the page to return to (?next=) and which flow it was (?flow=), because a failure
// goes back to where the flow started: the login page for signing in. Ticket 06 adds binding
// Discord from /me as a second flow through the same callback.

/** The path of the OAuth callback Route Handler. */
export const CALLBACK_PATH = '/auth/callback'

/** The flows that come back through the callback. */
export type OAuthFlow = 'sign-in'

/** Why an OAuth flow came back without a session. Sent to the page as ?error=. */
export type OAuthFailure = 'cancelled' | 'no_email' | 'unverified_email' | 'failed'

const FAILURE_MESSAGES: Record<OAuthFailure, string> = {
  cancelled: 'ยกเลิกการเข้าสู่ระบบด้วย Discord แล้ว ลองอีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลแทน',
  no_email: 'บัญชี Discord นี้ไม่มีอีเมล เพิ่มอีเมลในบัญชี Discord ก่อน แล้วลองอีกครั้ง',
  unverified_email: 'อีเมลในบัญชี Discord นี้ยังไม่ได้ยืนยัน ยืนยันอีเมลใน Discord ก่อน แล้วลองอีกครั้ง',
  failed: 'เข้าสู่ระบบด้วย Discord ไม่สำเร็จ ลองอีกครั้ง',
}

/** The Thai message for an ?error= the callback sent, or null for anything else. */
export function oauthFailureMessage(value: unknown): string | null {
  if (typeof value !== 'string' || !Object.hasOwn(FAILURE_MESSAGES, value)) return null
  return FAILURE_MESSAGES[value as OAuthFailure]
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

// Supabase Auth's message when the provider gave no email (internal/api/external.go).
const NO_EMAIL = 'Error getting user email from external provider'

// What went wrong, from the error Supabase Auth (or Discord, through it) put on the callback.
function failureFrom(params: URLSearchParams): OAuthFailure {
  const code = params.get('error_code')
  if (code === 'provider_email_needs_verification') return 'unverified_email'
  // Discord's answer when the visitor presses Cancel on its consent screen. Supabase Auth
  // passes it on with no error_code of its own.
  if (params.get('error') === 'access_denied' && !code) return 'cancelled'
  if (params.get('error_description')?.includes(NO_EMAIL)) return 'no_email'
  return 'failed'
}

const FLOWS: readonly OAuthFlow[] = ['sign-in']

// An unknown or missing ?flow= is treated as signing in.
function flowOf(params: URLSearchParams): OAuthFlow {
  return FLOWS.find((flow) => flow === params.get('flow')) ?? 'sign-in'
}

function failurePath(flow: OAuthFlow, returnTo: string, failure: OAuthFailure): string {
  switch (flow) {
    case 'sign-in':
      return `${loginPath(returnTo)}&error=${failure}`
  }
}

/**
 * Finishes an OAuth flow at the callback, given the callback's query. On success the session
 * is in `db`'s cookies (it must be able to write them: the Route Handler's request client).
 * Returns the path on this site to redirect to: the return-to page, or, on failure, the page
 * the flow started from with ?error= set to an OAuthFailure.
 */
export async function finishOAuth(db: Db, params: URLSearchParams): Promise<string> {
  const flow = flowOf(params)
  const returnTo = safeReturnTo(params.get('next'))
  if (params.has('error')) return failurePath(flow, returnTo, failureFrom(params))

  const code = params.get('code')
  if (!code) return failurePath(flow, returnTo, 'failed')
  const { error } = await db.auth.exchangeCodeForSession(code)
  if (error) {
    // Most often the code verifier cookie is missing: the flow started on another host
    // (localhost rather than 127.0.0.1) or in another browser, or the code was already used.
    console.warn(`OAuth code exchange failed: ${error.code ?? ''} ${error.message}`)
    return failurePath(flow, returnTo, 'failed')
  }
  return returnTo
}
