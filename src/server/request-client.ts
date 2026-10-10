import { cookies } from 'next/headers'
import { createSessionClient, type Db } from '@/server/supabase'

// The client a page or server action passes to every operation it calls. Call it once per
// page render or action and pass the result through.
//
// It acts as the Seller whose session is in this request's cookies, or as nobody when no one
// is signed in, so row-level security limits it to that Seller's rows. It is made fresh for
// every request and never shared.
export async function requestClient(): Promise<Db> {
  const store = await cookies()
  return createSessionClient({
    getAll: () => store.getAll(),
    setAll(cookiesToSet) {
      // Next lets a server action write cookies but not a page while it renders. When a page
      // reads an expired session, the proxy (src/proxy.ts) has already refreshed it for this
      // request, so there is nothing a page needs to write.
      try {
        for (const { name, value, options } of cookiesToSet) store.set(name, value, options)
      } catch {
        // Rendering a page: cookies are read-only here.
      }
    },
  })
}
