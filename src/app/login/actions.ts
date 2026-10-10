'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { safeReturnTo } from '@/lib/return-to'
import { SignInError, signInWithEmail, signOut, signUpWithEmail } from '@/server/auth'
import { requestClient } from '@/server/request-client'

// Wiring only: the rules live in @/server/auth. The request client writes the session
// cookies when signing in or out.

export type SignInState = { email: string; error: string | null }

export async function signInAction(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const db = await requestClient()
  const email = String(formData.get('email') ?? '')
  try {
    await signInWithEmail(db, email, String(formData.get('password') ?? ''))
  } catch (error) {
    if (error instanceof SignInError) return { email, error: error.message }
    throw error
  }
  // Drop any page rendered for the visitor before they signed in.
  revalidatePath('/', 'layout')
  redirect(safeReturnTo(formData.get('next')))
}

export type SignUpState = { email: string; displayName: string; error: string | null }

export async function signUpAction(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const db = await requestClient()
  const email = String(formData.get('email') ?? '')
  const displayName = String(formData.get('displayName') ?? '')
  try {
    await signUpWithEmail(db, {
      email,
      displayName,
      password: String(formData.get('password') ?? ''),
    })
  } catch (error) {
    if (error instanceof SignInError) return { email, displayName, error: error.message }
    throw error
  }
  revalidatePath('/', 'layout')
  redirect(safeReturnTo(formData.get('next')))
}

// Ends the session and goes to the landing page.
export async function signOutAction(): Promise<void> {
  const db = await requestClient()
  await signOut(db)
  revalidatePath('/', 'layout')
  redirect('/')
}
