'use server'

import { revalidatePath } from 'next/cache'
import {
  AccountError,
  changePassword,
  renameDisplayName,
  setFirstPassword,
} from '@/server/auth/account'
import { requestClient } from '@/server/db/request-client'

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
