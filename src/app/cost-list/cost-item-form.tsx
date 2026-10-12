'use client'

import { useActionState } from 'react'
import type { CostItemFormState } from '@/app/cost-list/actions'
import { ConfirmAction } from '@/components/confirm-action'
import { Field } from '@/components/field'
import { FormMessage } from '@/components/form-message'
import { OptionSelect } from '@/components/option-select'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { UNCATEGORISED } from '@/lib/category-colours'
import type { CostCategory } from '@/server/costs/cost-categories'
import type { CostItemInput } from '@/server/costs/cost-items'

type Props = {
  action: (previous: CostItemFormState, formData: FormData) => Promise<CostItemFormState>
  initial: CostItemInput
  categories: CostCategory[]
  submitLabel: string
  /** The submit button's text while saving, such as กำลังเพิ่ม… */
  pendingLabel: string
}

// One Cost Item's fields. Nothing is saved until the form is submitted.
export function CostItemForm({ action, initial, categories, submitLabel, pendingLabel }: Props) {
  const [state, formAction] = useActionState(action, { values: initial, error: null })

  return (
    <form
      action={formAction}
      className="grid gap-3 md:grid-cols-[2fr_1.25fr_1fr_1.5fr_auto] md:items-end"
    >
      <Field label="ชื่อ">
        <Input name="name" required defaultValue={state.values.name} />
      </Field>
      <Field label={<span className="whitespace-nowrap">ต้นทุนต่อหน่วย (฿)</span>}>
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
      <SubmitButton pendingLabel={pendingLabel} className="justify-self-start">
        {submitLabel}
      </SubmitButton>
      <FormMessage error={state.error} className="md:col-span-5" />
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
      pendingLabel="กำลังลบ…"
    />
  )
}
