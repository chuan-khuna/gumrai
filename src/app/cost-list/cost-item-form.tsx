'use client'

import { useActionState } from 'react'
import type { CostItemFormState } from '@/app/cost-list/actions'
import { ConfirmAction } from '@/components/confirm-action'
import { Field } from '@/components/field'
import { OptionSelect } from '@/components/option-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UNCATEGORISED } from '@/lib/category-colours'
import type { CostCategory } from '@/server/costs/cost-categories'
import type { CostItemInput } from '@/server/costs/cost-items'

type Props = {
  action: (previous: CostItemFormState, formData: FormData) => Promise<CostItemFormState>
  initial: CostItemInput
  categories: CostCategory[]
  submitLabel: string
}

// One Cost Item's fields. Nothing is saved until the form is submitted.
export function CostItemForm({ action, initial, categories, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, { values: initial, error: null })

  return (
    <form
      action={formAction}
      className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1.5fr_auto] sm:items-end"
    >
      <Field label="ชื่อ">
        <Input name="name" required defaultValue={state.values.name} />
      </Field>
      <Field label="ต้นทุนต่อหน่วย (฿)">
        <Input
          name="unitCost"
          required
          inputMode="decimal"
          defaultValue={state.values.unitCost}
          className="text-right tabular-nums"
        />
      </Field>
      <Field label="หน่วย">
        <Input name="unit" required placeholder="g, ml, ชิ้น" defaultValue={state.values.unit} />
      </Field>
      <Field label="หมวด">
        <OptionSelect
          name="categoryId"
          aria-label="หมวด"
          defaultValue={state.values.categoryId ?? ''}
          key={state.values.categoryId ?? ''}
          options={[
            { value: '', label: UNCATEGORISED, dot: null },
            ...categories.map((c) => ({ value: c.id, label: c.name, dot: c.colourSlot })),
          ]}
          className="w-full"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-loss sm:col-span-5">
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
  return (
    <ConfirmAction
      action={action}
      trigger="ลบรายการนี้"
      size="default"
      title={`ลบ "${name}"?`}
      description={
        sheetCount === 0
          ? undefined
          : `ใช้อยู่ใน ${sheetCount} ชีต บรรทัดที่ใช้รายการนี้จะกลายเป็นรายการพิมพ์เอง โดยเก็บชื่อ ต้นทุนต่อหน่วย หน่วย และหมวดล่าสุดไว้ ตัวเลขในชีตไม่เปลี่ยน`
      }
      confirmLabel="ลบรายการ"
    />
  )
}
