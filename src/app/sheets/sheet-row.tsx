'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  deleteCostSheetAction,
  duplicateCostSheetAction,
  renameCostSheetAction,
} from '@/app/sheets/actions'
import type { CostSheetSummary } from '@/server/cost-sheets'

const button = 'rounded border border-line px-3 py-1 text-sm disabled:opacity-60'

// One Cost Sheet in the list: open it, rename it in place, duplicate it, or delete it after
// asking.
export function SheetRow({ sheet }: { sheet: CostSheetSummary }) {
  const [renaming, setRenaming] = useState(false)

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      {renaming ? (
        <RenameForm sheet={sheet} onDone={() => setRenaming(false)} />
      ) : (
        <>
          <Link
            href={`/sheets/${sheet.id}`}
            className="flex min-w-0 flex-1 items-baseline justify-between gap-4"
          >
            <span>{sheet.name}</span>
            <span className="text-sm text-muted">ต่อ{sheet.saleUnit}</span>
          </Link>
          <button type="button" onClick={() => setRenaming(true)} className={button}>
            เปลี่ยนชื่อ
          </button>
          <form action={duplicateCostSheetAction.bind(null, sheet.id)}>
            <button type="submit" className={button}>
              ทำสำเนา
            </button>
          </form>
          <form action={deleteCostSheetAction.bind(null, sheet.id)}>
            <button
              type="submit"
              onClick={(event) => {
                if (!window.confirm(`ลบชีต "${sheet.name}"? ลบแล้วกู้คืนไม่ได้`)) {
                  event.preventDefault()
                }
              }}
              className="rounded border border-loss px-3 py-1 text-sm text-loss"
            >
              ลบ
            </button>
          </form>
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
      <input
        name="name"
        required
        autoFocus
        aria-label="ชื่อชีต"
        defaultValue={state.name}
        className="min-w-0 flex-1 rounded border border-line bg-card px-3 py-1"
      />
      <button type="submit" disabled={pending} className={button}>
        บันทึกชื่อ
      </button>
      <button type="button" onClick={onDone} className={button}>
        ยกเลิก
      </button>
      {state.error && (
        <p role="alert" className="w-full text-loss">
          {state.error}
        </p>
      )}
    </form>
  )
}
