'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/form-message'
import { SubmitButton } from '@/components/submit-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RenameState = { name: string; error: string | null }

// Renames a list row in place, opened from its ⋯ menu (DESIGN.md § Row actions): the field
// takes focus, บันทึกชื่อ is the small pink push, and ยกเลิก or Esc puts the row back.
export function InlineRenameForm({
  action,
  name,
  label,
  onDone,
}: {
  action: (previous: RenameState, formData: FormData) => Promise<RenameState>
  name: string
  /** The field's name for screen readers, such as ชื่อชีต */
  label: string
  onDone: () => void
}) {
  const [state, formAction] = useActionState(
    async (previous: RenameState, formData: FormData) => {
      const next = await action(previous, formData)
      if (next.error === null) onDone()
      return next
    },
    { name, error: null },
  )

  return (
    <form action={formAction} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <Input
        name="name"
        required
        autoFocus
        onKeyDown={(event) => event.key === 'Escape' && onDone()}
        aria-label={label}
        defaultValue={state.name}
        aria-invalid={state.error ? true : undefined}
        className="h-9 min-w-0 flex-1 basis-40"
      />
      <SubmitButton size="sm" pendingLabel="กำลังบันทึก…">
        บันทึกชื่อ
      </SubmitButton>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        ยกเลิก
      </Button>
      <FormMessage error={state.error} />
    </form>
  )
}
