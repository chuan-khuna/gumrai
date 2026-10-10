import { createServerClient, type Db } from '@/server/supabase'

// The client a page or server action passes to every operation it calls. Call it once per
// page render or action and pass the result through.
//
// Today it is the secret-key client, so nothing the seller sees has changed. When sign-in
// lands it becomes a client carrying the signed-in seller's session from the request's
// cookies, which is why it is async.
export async function requestClient(): Promise<Db> {
  return createServerClient()
}
