'use client'

import { useActionState } from 'react'
import type { CategoryFormState } from '@/app/cost-list/categories/actions'

type Action = (previous: CategoryFormState, formData: FormData) => Promise<CategoryFormState>

const field = 'w-full rounded border border-line bg-card px-3 py-2'

// A Cost Category's name: for adding one, or renaming one in place.
export function CategoryNameForm({
  action,
  initialName,
  submitLabel,
  label,
}: {
  action: Action
  initialName: string
  submitLabel: string
  label: string
}) {
  const [state, formAction, pending] = useActionState(action, { name: initialName, error: null })

  return (
    <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
      <input
        name="name"
        required
        aria-label={label}
        placeholder={label}
        defaultValue={state.name}
        key={state.name}
        className={`${field} min-w-0 flex-1`}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-line px-4 py-2 disabled:opacity-60"
      >
        {submitLabel}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-loss">
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
  const question =
    itemCount === 0
      ? `ลบหมวด "${name}"? หมวดนี้ไม่มีรายการต้นทุน`
      : `ลบหมวด "${name}"? รายการต้นทุน ${itemCount} รายการในหมวดนี้จะกลายเป็นไม่มีหมวด (รายการไม่ถูกลบ)`

  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(event) => {
          if (!window.confirm(question)) event.preventDefault()
        }}
        className="rounded border border-loss px-3 py-2 text-loss"
      >
        ลบ
      </button>
    </form>
  )
}
