import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { finishOAuth } from '@/server/auth/oauth'
import { requestClient } from '@/server/db/request-client'

// Where Supabase Auth sends the visitor back after Discord. Wiring only: the rules live in
// @/server/auth/oauth. A Route Handler, not a page, because it must write the session cookies,
// which Next allows here and in server actions but not while a page renders.
export async function GET(request: NextRequest) {
  const db = await requestClient()
  const to = await finishOAuth(db, request.nextUrl.searchParams)
  // Drop any page rendered for the visitor before they signed in.
  revalidatePath('/', 'layout')
  redirect(to)
}
