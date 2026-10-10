'use client'

import { useActionState } from 'react'
import { signInAction, signUpAction } from '@/app/login/actions'
import { Field } from '@/components/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-lg bg-loss-surface px-3 py-2 text-sm text-foreground">
      {error}
    </p>
  )
}

export function SignInForm({ returnTo }: { returnTo: string }) {
  const [state, formAction, pending] = useActionState(signInAction, { email: '', error: null })
  const invalid = state.error ? true : undefined

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={returnTo} />
      <Field label="อีเมล">
        <Input name="email" type="email" autoComplete="email" required defaultValue={state.email} aria-invalid={invalid} />
      </Field>
      <Field label="รหัสผ่าน">
        <Input name="password" type="password" autoComplete="current-password" required aria-invalid={invalid} />
      </Field>
      <FormError error={state.error} />
      <Button type="submit" disabled={pending}>
        {pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </Button>
    </form>
  )
}

// minPasswordLength is the rule from @/server/auth/auth, passed in for the field hint.
export function SignUpForm({ returnTo, minPasswordLength }: { returnTo: string; minPasswordLength: number }) {
  const [state, formAction, pending] = useActionState(signUpAction, {
    email: '',
    displayName: '',
    error: null,
  })
  const invalid = state.error ? true : undefined

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={returnTo} />
      <Field label="ชื่อที่แสดง">
        <Input
          name="displayName"
          autoComplete="nickname"
          required
          placeholder="เช่น ร้านมัทฉะของฉัน"
          defaultValue={state.displayName}
          aria-invalid={invalid}
        />
      </Field>
      <Field label="อีเมล">
        <Input name="email" type="email" autoComplete="email" required defaultValue={state.email} aria-invalid={invalid} />
      </Field>
      <Field label={`รหัสผ่าน (อย่างน้อย ${minPasswordLength} ตัวอักษร)`}>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={minPasswordLength}
          aria-invalid={invalid}
        />
      </Field>
      <FormError error={state.error} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'กำลังสมัคร…' : 'สมัครใช้งาน'}
      </Button>
    </form>
  )
}
