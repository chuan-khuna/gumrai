'use client'

import { useActionState } from 'react'
import { createCostSheetAction } from '@/app/sheets/actions'
import { Field } from '@/components/field'
import { FormMessage } from '@/components/form-message'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'

// Names a new Cost Sheet and opens it.
export function CreateSheetForm() {
  const [state, formAction] = useActionState(createCostSheetAction, {
    name: '',
    error: null,
  })

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="ชื่อชีต" className="flex-1 basis-56">
        <Input
          name="name"
          required
          placeholder="เช่น มัทฉะลาเต้"
          defaultValue={state.name}
          aria-invalid={state.error ? true : undefined}
        />
      </Field>
      <SubmitButton pendingLabel="กำลังสร้าง…">สร้าง</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  )
}
