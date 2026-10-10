import { NextResponse, type NextRequest } from 'next/server'
import { createSessionClient } from '@/server/db/supabase'

/**
 * For the proxy (src/proxy.ts), before any page renders: reads the request's session and,
 * when its access token has expired, refreshes it. The new cookies are written both onto the
 * request (so the page about to render reads the fresh session) and onto the response (so
 * the browser keeps it). Returns that response and whether a Seller is signed in.
 */
export async function refreshSession(
  request: NextRequest,
): Promise<{ response: NextResponse; signedIn: boolean }> {
  let response = NextResponse.next({ request })
  const db = createSessionClient({
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet, headers) {
      for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
      response = NextResponse.next({ request })
      for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      // No-cache headers, so a shared cache never serves one Seller's cookies to another.
      for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
    },
  })
  // getClaims verifies the access token and refreshes it if it has expired. Nothing may run
  // between making the client and this call, or a refresh could be lost.
  const { data } = await db.auth.getClaims()
  return { response, signedIn: Boolean(data?.claims) }
}
