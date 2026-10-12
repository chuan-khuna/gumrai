'use client'

import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useActionState, useState } from 'react'
import {
  createCostCategoryAction,
  deleteCostCategoryAction,
  renameCostCategoryAction,
} from '@/app/cost-list/categories/actions'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { ConfirmAction } from '@/components/confirm-action'
import { Field } from '@/components/field'
import { FormMessage } from '@/components/form-message'
import { InlineRenameForm } from '@/components/inline-rename-form'
import { RowMenu } from '@/components/row-menu'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import type { CostCategory } from '@/server/costs/cost-categories'

// Adds a Cost Category: the page's main action, with its label shown above like every add form.
export function AddCategoryForm() {
  const [state, formAction] = useActionState(createCostCategoryAction, {
    name: '',
    error: null,
  })

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="ชื่อหมวด" className="flex-1 basis-56">
        <Input
          name="name"
          required
          defaultValue={state.name}
          key={state.name}
          aria-invalid={state.error ? true : undefined}
        />
      </Field>
      <SubmitButton pendingLabel="กำลังเพิ่ม…">เพิ่ม</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  )
}

// One Cost Category in the list: its dot, name and item count, and a ⋯ menu to rename it in
// place or delete it after asking, saying how many Cost Items will become ไม่มีหมวด.
export function CategoryRow({ category, itemCount }: { category: CostCategory; itemCount: number }) {
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <li className="flex items-center gap-3 px-6 py-3">
      <CategoryDot colourSlot={category.colourSlot} />
      {renaming ? (
        <InlineRenameForm
          action={renameCostCategoryAction.bind(null, category.id)}
          name={category.name}
          label={`ชื่อหมวด ${category.name}`}
          onDone={() => setRenaming(false)}
        />
      ) : (
        <>
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{category.name}</span>
          <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
            {itemCount} รายการ
          </span>
          <RowMenu
            label={`ตัวเลือกของหมวด ${category.name}`}
            items={[
              {
                label: 'เปลี่ยนชื่อ',
                icon: <PencilIcon />,
                onSelect: () => setRenaming(true),
                takesFocus: true,
              },
            ]}
            destructive={{
              label: 'ลบ',
              icon: <Trash2Icon />,
              onSelect: () => setDeleting(true),
              takesFocus: true,
            }}
          />
          <ConfirmAction
            open={deleting}
            onOpenChange={setDeleting}
            action={deleteCostCategoryAction.bind(null, category.id)}
            title={`ลบหมวด "${category.name}"?`}
            description={
              itemCount === 0
                ? 'หมวดนี้ไม่มีรายการต้นทุน'
                : `รายการต้นทุน ${itemCount} รายการในหมวดนี้จะกลายเป็นไม่มีหมวด (รายการไม่ถูกลบ)`
            }
            confirmLabel="ลบหมวด"
            pendingLabel="กำลังลบ…"
          />
        </>
      )}
    </li>
  )
}
