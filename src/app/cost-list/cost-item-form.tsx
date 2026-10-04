'use client'

import { useActionState } from 'react'
import type { CostItemFormState } from '@/app/cost-list/actions'
import type { CostItemInput } from '@/server/cost-items'

type Props = {
  action: (previous: CostItemFormState, formData: FormData) => Promise<CostItemFormState>
  initial: CostItemInput
  submitLabel: string
}

// One Cost Item's fields. Nothing is saved until the form is submitted.
export function CostItemForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, { values: initial, error: null })
  const field = 'mt-1 w-full rounded border border-line bg-card px-3 py-2'

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <label className="block">
        <span className="text-sm text-muted">ชื่อ</span>
        <input name="name" required defaultValue={state.values.name} className={field} />
      </label>
      <label className="block">
        <span className="text-sm text-muted">ต้นทุนต่อหน่วย (฿)</span>
        <input
          name="unitCost"
          required
          inputMode="decimal"
          defaultValue={state.values.unitCost}
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm text-muted">หน่วย</span>
        <input name="unit" required placeholder="g, ml, ชิ้น" defaultValue={state.values.unit} className={field} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 font-medium text-card disabled:opacity-60"
      >
        {submitLabel}
      </button>
      {state.error && (
        <p role="alert" className="text-loss sm:col-span-4">
          {state.error}
        </p>
      )}
    </form>
  )
}
