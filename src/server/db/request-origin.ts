import { headers } from 'next/headers'

// This site's origin as the visitor's browser sees it, for a URL the visitor is sent back to
// (the OAuth callback). A form post carries it in Origin; otherwise it is rebuilt from the
// forwarded host or the Host header. Call it from a server action.
export async function requestOrigin(): Promise<string> {
  const list = await headers()
  const origin = list.get('origin')
  if (origin && origin !== 'null') return origin
  const proto = list.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${list.get('x-forwarded-host') ?? list.get('host')}`
}
