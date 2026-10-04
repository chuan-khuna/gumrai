'use client'

import { useActionState } from 'react'
import type { CostItemFormState } from '@/app/cost-list/actions'
import { UNCATEGORISED } from '@/lib/category-colours'
import type { CostCategory } from '@/server/cost-categories'
import type { CostItemInput } from '@/server/cost-items'

type Props = {
  action: (previous: CostItemFormState, formData: FormData) => Promise<CostItemFormState>
  initial: CostItemInput
  categories: CostCategory[]
  submitLabel: string
}

// One Cost Item's fields. Nothing is saved until the form is submitted.
export function CostItemForm({ action, initial, categories, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, { values: initial, error: null })
  const field = 'mt-1 w-full rounded border border-line bg-card px-3 py-2'

  return (
    <form
      action={formAction}
      className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1.5fr_auto] sm:items-end"
    >
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
      <label className="block">
        <span className="text-sm text-muted">หมวด</span>
        <select
          name="categoryId"
          defaultValue={state.values.categoryId ?? ''}
          key={state.values.categoryId ?? ''}
          className={field}
        >
          <option value="">{UNCATEGORISED}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 font-medium text-card disabled:opacity-60"
      >
        {submitLabel}
      </button>
      {state.error && (
        <p role="alert" className="text-loss sm:col-span-5">
          {state.error}
        </p>
      )}
    </form>
  )
}

// Deletes a Cost Item after asking. When sheets use it, says how many, and that their lines
// keep the item's values as typed-in lines (ADR 0002).
export function DeleteCostItemButton({
  action,
  name,
  sheetCount,
}: {
  action: () => Promise<void>
  name: string
  sheetCount: number
}) {
  const question =
    sheetCount === 0
      ? `ลบ "${name}"?`
      : `ลบ "${name}"? ใช้อยู่ใน ${sheetCount} ชีต บรรทัดที่ใช้รายการนี้จะกลายเป็นรายการพิมพ์เอง โดยเก็บชื่อ ต้นทุนต่อหน่วย หน่วย และหมวดล่าสุดไว้ ตัวเลขในชีตไม่เปลี่ยน`

  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(event) => {
          if (!window.confirm(question)) event.preventDefault()
        }}
        className="rounded border border-loss px-4 py-2 text-loss"
      >
        ลบรายการนี้
      </button>
    </form>
  )
}
