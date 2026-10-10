// Where a Seller goes after signing in: the page they were sent away from, carried through the
// login page as ?next=. Only a path on this site is honoured, so a crafted link cannot send a
// Seller to another site after they sign in.

/** Where a Seller lands after signing in when no page asked for them. */
export const DEFAULT_RETURN_TO = '/sheets'

/** `value` when it is a path on this site, else the Cost Sheets page. */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_RETURN_TO
  // "/x" only: not "//host" or "/\host" (both mean another host to a browser), and no control
  // characters, which browsers strip, so "/\t/host" would become "//host".
  if (!value.startsWith('/') || /^\/[/\\]/.test(value) || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return DEFAULT_RETURN_TO
  }
  // The login page itself is never somewhere to return to.
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) {
    return DEFAULT_RETURN_TO
  }
  return value
}

/** The login page, set to return to `returnTo` afterwards. */
export function loginPath(returnTo: string): string {
  return `/login?next=${encodeURIComponent(safeReturnTo(returnTo))}`
}
