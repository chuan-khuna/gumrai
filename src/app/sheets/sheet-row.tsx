'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  deleteCostSheetAction,
  duplicateCostSheetAction,
  renameCostSheetAction,
} from '@/app/sheets/actions'
import { ConfirmAction } from '@/components/confirm-action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CostSheetSummary } from '@/server/costs/cost-sheets'

// One Cost Sheet in the list: open it, rename it in place, duplicate it, or delete it after
// asking.
export function SheetRow({ sheet }: { sheet: CostSheetSummary }) {
  const [renaming, setRenaming] = useState(false)

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-card transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      {renaming ? (
        <RenameForm sheet={sheet} onDone={() => setRenaming(false)} />
      ) : (
        <>
          <Link
            href={`/sheets/${sheet.id}`}
            className="flex min-w-0 flex-1 basis-48 items-baseline justify-between gap-4 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <span className="font-heading text-lg">{sheet.name}</span>
            <span className="text-sm text-muted-foreground">ต่อ{sheet.saleUnit}</span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setRenaming(true)}>
              เปลี่ยนชื่อ
            </Button>
            <form action={duplicateCostSheetAction.bind(null, sheet.id)}>
              <Button type="submit" variant="outline" size="sm">
                ทำสำเนา
              </Button>
            </form>
            <ConfirmAction
              action={deleteCostSheetAction.bind(null, sheet.id)}
              trigger="ลบ"
              title={`ลบชีต "${sheet.name}"?`}
              description="ลบแล้วกู้คืนไม่ได้"
              confirmLabel="ลบชีต"
            />
          </div>
        </>
      )}
    </li>
  )
}

function RenameForm({ sheet, onDone }: { sheet: CostSheetSummary; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (previous: { name: string; error: string | null }, formData: FormData) => {
      const next = await renameCostSheetAction(sheet.id, previous, formData)
      if (next.error === null) onDone()
      return next
    },
    { name: sheet.name, error: null },
  )

  return (
    <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
      <Input
        name="name"
        required
        autoFocus
        aria-label="ชื่อชีต"
        defaultValue={state.name}
        aria-invalid={state.error ? true : undefined}
        className="h-9 flex-1 basis-48"
      />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        บันทึกชื่อ
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        ยกเลิก
      </Button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-loss">
          {state.error}
        </p>
      )}
    </form>
  )
}
