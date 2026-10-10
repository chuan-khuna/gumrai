'use client'

import { useActionState } from 'react'
import {
  changePasswordAction,
  renameDisplayNameAction,
  setFirstPasswordAction,
} from '@/app/me/actions'
import { Field } from '@/components/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FormMessage({ error, saved, savedText }: { error: string | null; saved: boolean; savedText: string }) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-loss">
        {error}
      </p>
    )
  }
  if (!saved) return null
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {savedText}
    </p>
  )
}

export function DisplayNameForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(renameDisplayNameAction, {
    displayName,
    error: null,
    saved: false,
  })
  const invalid = state.error ? true : undefined

  return (
    // One row from sm up: the field grows, the button keeps its size beside it.
    <form action={formAction} className="grid gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="ชื่อที่แสดง" className="flex-1 basis-56">
          <Input
            name="displayName"
            autoComplete="nickname"
            required
            defaultValue={state.displayName}
            aria-invalid={invalid}
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? 'กำลังบันทึก…' : 'บันทึกชื่อ'}
        </Button>
      </div>
      <FormMessage error={state.error} saved={state.saved} savedText="บันทึกชื่อที่แสดงแล้ว" />
    </form>
  )
}

// minPasswordLength is the rule from @/server/auth/auth, passed in for the field hint.
export function ChangePasswordForm({ email, minPasswordLength }: { email: string; minPasswordLength: number }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, { error: null, saved: false })
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
      <FormMessage error={state.error} saved={state.saved} savedText="เปลี่ยนรหัสผ่านแล้ว" />
      <Button type="submit" variant="secondary" disabled={pending} className="justify-self-start">
        {pending ? 'กำลังเปลี่ยน…' : 'เปลี่ยนรหัสผ่าน'}
      </Button>
    </form>
  )
}

export function SetPasswordForm({ email, minPasswordLength }: { email: string; minPasswordLength: number }) {
  const [state, formAction, pending] = useActionState(setFirstPasswordAction, { error: null, saved: false })
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
      <FormMessage error={state.error} saved={state.saved} savedText="ตั้งรหัสผ่านแล้ว" />
      <Button type="submit" variant="secondary" disabled={pending} className="justify-self-start">
        {pending ? 'กำลังตั้ง…' : 'ตั้งรหัสผ่าน'}
      </Button>
    </form>
  )
}
