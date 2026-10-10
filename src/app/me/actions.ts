'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  AccountError,
  changePassword,
  deleteAccount,
  renameDisplayName,
  setFirstPassword,
  shuffleAvatarPattern,
  unbindSignInMethod,
} from '@/server/auth/account'
import { startDiscordBind } from '@/server/auth/oauth'
import { requestClient } from '@/server/db/request-client'
import { requestOrigin } from '@/server/db/request-origin'

// Wiring only: the rules live in @/server/auth/account. The request client writes the
// session cookies when Supabase Auth hands back a new session after a password change.

export type DisplayNameState = { displayName: string; error: string | null; saved: boolean }

export async function renameDisplayNameAction(
  _previous: DisplayNameState,
  formData: FormData,
): Promise<DisplayNameState> {
  const db = await requestClient()
  const displayName = String(formData.get('displayName') ?? '')
  try {
    const saved = await renameDisplayName(db, displayName)
    // The header in every Seller section shows the Display Name.
    revalidatePath('/', 'layout')
    return { displayName: saved, error: null, saved: true }
  } catch (error) {
    if (error instanceof AccountError) return { displayName, error: error.message, saved: false }
    throw error
  }
}

// A new random avatar pattern. Every page is revalidated: the header shows the avatar.
export async function shuffleAvatarPatternAction(): Promise<void> {
  const db = await requestClient()
  await shuffleAvatarPattern(db)
  revalidatePath('/', 'layout')
}

export type PasswordState = { error: string | null; saved: boolean }

export async function changePasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const db = await requestClient()
  try {
    await changePassword(
      db,
      String(formData.get('currentPassword') ?? ''),
      String(formData.get('newPassword') ?? ''),
    )
  } catch (error) {
    if (error instanceof AccountError) return { error: error.message, saved: false }
    throw error
  }
  return { error: null, saved: true }
}

export async function setFirstPasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const db = await requestClient()
  try {
    await setFirstPassword(db, String(formData.get('newPassword') ?? ''))
  } catch (error) {
    if (error instanceof AccountError) return { error: error.message, saved: false }
    throw error
  }
  // The page now shows the change form instead of ตั้งรหัสผ่าน.
  revalidatePath('/me')
  return { error: null, saved: true }
}

// Deletes the Seller and everything they own, signs them out, and goes to the landing page.
// The dialog only lets `delete` through; deleteAccount refuses anything else again here.
export async function deleteAccountAction(confirmation: string): Promise<void> {
  const db = await requestClient()
  await deleteAccount(db, String(confirmation))
  revalidatePath('/', 'layout')
  redirect('/')
}

// Sends the Seller to Discord to bind it (through Supabase Auth). They come back through
// /auth/callback to /me, with ?bound=discord or ?error=.
export async function bindDiscordAction(): Promise<void> {
  const db = await requestClient()
  const url = await startDiscordBind(db, await requestOrigin())
  redirect(url)
}

// Unbinding a way to sign in. The page offers it only when another way remains; the account
// module refuses otherwise.
export async function unbindDiscordAction(): Promise<void> {
  const db = await requestClient()
  await unbindSignInMethod(db, 'discord')
  revalidatePath('/', 'layout')
}

// Needs the current password, as changing it does. Returns a Thai message when it is refused.
export async function unbindEmailAction(currentPassword: string): Promise<string | void> {
  const db = await requestClient()
  try {
    await unbindSignInMethod(db, 'email', String(currentPassword))
  } catch (error) {
    if (error instanceof AccountError) return error.message
    throw error
  }
  revalidatePath('/', 'layout')
}
