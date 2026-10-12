'use client'

import { useActionState } from 'react'
import {
  changePasswordAction,
  renameDisplayNameAction,
  setFirstPasswordAction,
} from '@/app/me/actions'
import { Field } from '@/components/field'
import { FormMessage } from '@/components/form-message'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'

export function DisplayNameForm({ displayName }: { displayName: string }) {
  const [state, formAction] = useActionState(renameDisplayNameAction, {
    displayName,
    error: null,
    saved: false,
  })
  const invalid = state.error ? true : undefined

  return (
    // One field, so the button sits beside it, as in every one-field form.
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {/* The section heading already reads ชื่อที่แสดง. */}
      <Field label="ชื่อที่แสดง" hideLabel className="flex-1 basis-56">
        <Input
          name="displayName"
          autoComplete="nickname"
          required
          defaultValue={state.displayName}
          aria-invalid={invalid}
        />
      </Field>
      <SubmitButton pendingLabel="กำลังบันทึก…">บันทึกชื่อ</SubmitButton>
      <FormMessage error={state.error} saved={state.saved ? 'บันทึกชื่อที่แสดงแล้ว' : null} />
    </form>
  )
}

// minPasswordLength is the rule from @/server/auth/auth, passed in for the field hint.
export function ChangePasswordForm({ email, minPasswordLength }: { email: string; minPasswordLength: number }) {
  const [state, formAction] = useActionState(changePasswordAction, { error: null, saved: false })
  const invalid = state.error ? true : undefined

  return (
    <form action={formAction} className="grid gap-4">
      {/* Lets a password manager tie the new password to the right account. */}
      <input type="hidden" name="username" autoComplete="username" value={email} />
      <Field label="รหัสผ่านปัจจุบัน">
        <Input name="currentPassword" type="password" autoComplete="current-password" required aria-invalid={invalid} />
      </Field>
      <Field label={`รหัสผ่านใหม่ (อย่างน้อย ${minPasswordLength} ตัวอักษร)`}>
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={minPasswordLength}
          aria-invalid={invalid}
        />
      </Field>
      <SubmitButton pendingLabel="กำลังเปลี่ยน…" className="justify-self-start">
        เปลี่ยนรหัสผ่าน
      </SubmitButton>
      <FormMessage error={state.error} saved={state.saved ? 'เปลี่ยนรหัสผ่านแล้ว' : null} />
    </form>
  )
}

export function SetPasswordForm({ email, minPasswordLength }: { email: string; minPasswordLength: number }) {
  const [state, formAction] = useActionState(setFirstPasswordAction, { error: null, saved: false })
  const invalid = state.error ? true : undefined

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="username" autoComplete="username" value={email} />
      <Field label={`รหัสผ่าน (อย่างน้อย ${minPasswordLength} ตัวอักษร)`}>
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={minPasswordLength}
          aria-invalid={invalid}
        />
      </Field>
      <SubmitButton pendingLabel="กำลังตั้ง…" className="justify-self-start">
        ตั้งรหัสผ่าน
      </SubmitButton>
      <FormMessage error={state.error} saved={state.saved ? 'ตั้งรหัสผ่านแล้ว' : null} />
    </form>
  )
}
