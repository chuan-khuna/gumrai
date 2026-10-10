import { NextResponse, type NextRequest } from 'next/server'
import { loginPath } from '@/lib/return-to'
import { refreshSession } from '@/server/db/session'

// Runs before every page (Next 16 renamed middleware to proxy). It keeps the Seller's session
// fresh and sends signed-out visitors from a Seller's pages to the login page, remembering
// where they were going. This is the quick check; row-level security is what actually keeps
// each Seller's data apart, and the Seller layouts check again with currentSeller.

// The pages that need a signed-in Seller, and everything under them.
const SELLER_PAGES = ['/sheets', '/cost-list']

function isSellerPage(pathname: string) {
  return SELLER_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
}

export async function proxy(request: NextRequest) {
  const { response, signedIn } = await refreshSession(request)
  const { pathname, search } = request.nextUrl
  if (signedIn || !isSellerPage(pathname)) return response

  const redirect = NextResponse.redirect(new URL(loginPath(pathname + search), request.url))
  // Keep any cookie the refresh cleared, so a dead session does not linger.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}

export const config = {
  // Every page, but not Next's own files or static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
