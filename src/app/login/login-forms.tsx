'use client'

import { useActionState } from 'react'
import { signInAction, signUpAction } from '@/app/login/actions'
import { Field } from '@/components/field'
import { FormMessage } from '@/components/form-message'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'

export function SignInForm({ returnTo }: { returnTo: string }) {
  const [state, formAction] = useActionState(signInAction, { email: '', error: null })
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
      <SubmitButton pendingLabel="กำลังเข้าสู่ระบบ…" className="justify-self-start">
        เข้าสู่ระบบ
      </SubmitButton>
      <FormMessage error={state.error} />
    </form>
  )
}

// minPasswordLength is the rule from @/server/auth/auth, passed in for the field hint.
export function SignUpForm({ returnTo, minPasswordLength }: { returnTo: string; minPasswordLength: number }) {
  const [state, formAction] = useActionState(signUpAction, {
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
      <SubmitButton pendingLabel="กำลังสมัคร…" className="justify-self-start">
        สมัครใช้งาน
      </SubmitButton>
      <FormMessage error={state.error} />
    </form>
  )
}
