'use client'

import { useActionState } from 'react'
import type { CategoryFormState } from '@/app/cost-list/categories/actions'
import { ConfirmAction } from '@/components/confirm-action'
import { Field } from '@/components/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Action = (previous: CategoryFormState, formData: FormData) => Promise<CategoryFormState>

// A Cost Category's name: for adding one (`primary`, the page's main action, with its label
// shown above like every add form), or renaming one in place.
export function CategoryNameForm({
  action,
  initialName,
  submitLabel,
  label,
  primary = false,
}: {
  action: Action
  initialName: string
  submitLabel: string
  label: string
  primary?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, { name: initialName, error: null })

  const input = (
    <Input
      name="name"
      required
      aria-label={primary ? undefined : label}
      placeholder={primary ? undefined : label}
      defaultValue={state.name}
      key={state.name}
      aria-invalid={state.error ? true : undefined}
      className={primary ? undefined : 'h-9 min-w-0 flex-1 basis-0'}
    />
  )

  return (
    <form
      action={formAction}
      className={
        primary
          ? 'flex flex-wrap items-end gap-3'
          : 'flex min-w-0 flex-1 flex-wrap items-center gap-2'
      }
    >
      {primary ? (
        <Field label={label} className="flex-1 basis-56">
          {input}
        </Field>
      ) : (
        input
      )}
      <Button
        type="submit"
        variant={primary ? 'default' : 'outline'}
        size={primary ? 'default' : 'sm'}
        disabled={pending}
      >
        {submitLabel}
      </Button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-loss">
          {state.error}
        </p>
      )}
    </form>
  )
}

// Deletes a Cost Category after asking, saying how many Cost Items will become ไม่มีหมวด.
export function DeleteCategoryButton({
  action,
  name,
  itemCount,
}: {
  action: () => Promise<void>
  name: string
  itemCount: number
}) {
  return (
    <ConfirmAction
      action={action}
      trigger="ลบ"
      title={`ลบหมวด "${name}"?`}
      description={
        itemCount === 0
          ? 'หมวดนี้ไม่มีรายการต้นทุน'
          : `รายการต้นทุน ${itemCount} รายการในหมวดนี้จะกลายเป็นไม่มีหมวด (รายการไม่ถูกลบ)`
      }
      confirmLabel="ลบหมวด"
      pendingLabel="กำลังลบ…"
    />
  )
}
