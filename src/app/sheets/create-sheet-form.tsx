'use client'

import { useActionState } from 'react'
import { createCostSheetAction } from '@/app/sheets/actions'
import { Field } from '@/components/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Names a new Cost Sheet and opens it.
export function CreateSheetForm() {
  const [state, formAction, pending] = useActionState(createCostSheetAction, {
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
      <Button type="submit" disabled={pending}>
        {pending ? 'กำลังสร้าง…' : 'สร้าง'}
      </Button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-loss">
          {state.error}
        </p>
      )}
    </form>
  )
}
