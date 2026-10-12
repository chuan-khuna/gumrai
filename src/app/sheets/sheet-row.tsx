'use client'

import { CopyIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  deleteCostSheetAction,
  duplicateCostSheetAction,
  renameCostSheetAction,
} from '@/app/sheets/actions'
import { ConfirmAction } from '@/components/confirm-action'
import { InlineRenameForm } from '@/components/inline-rename-form'
import { RowMenu } from '@/components/row-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import type { CostSheetSummary } from '@/server/costs/cost-sheets'
import { cn } from 'cn'

const baht = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// The column count, for the rename form that spans the row.
const SHEET_COLUMNS = 5

// One Cost Sheet in the table: its name opens it, then its Selling Price, cost and Net Profit
// per Sale Unit, and a ⋯ menu to rename it in place, duplicate it, or delete it after asking.
// Phones have no room for the price and cost columns, so they sit under the name.
export function SheetRow({ sheet }: { sheet: CostSheetSummary }) {
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, startDuplicate] = useTransition()
  // A sheet with no price yet has no profit to speak of; −cost would claim a loss.
  const priced = Number(sheet.sellingPrice) > 0

  if (renaming) {
    return (
      <TableRow>
        <TableCell colSpan={SHEET_COLUMNS} className="py-3 pr-4 pl-6">
          <InlineRenameForm
            action={renameCostSheetAction.bind(null, sheet.id)}
            name={sheet.name}
            label="ชื่อชีต"
            onDone={() => setRenaming(false)}
          />
        </TableCell>
      </TableRow>
    )
  }

  return (
    // The name links to the sheet; its ::after stretches over the whole row.
    <TableRow className="relative hover:bg-accent focus-within:bg-accent">
      <TableCell className="py-3 pl-6 whitespace-normal">
        <Link
          href={`/sheets/${sheet.id}`}
          className="font-heading text-lg font-medium outline-none [overflow-wrap:anywhere] after:absolute after:inset-0 focus-visible:underline"
        >
          {sheet.name}
        </Link>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          ต่อ{sheet.saleUnit}
          <span className="tabular-nums sm:hidden">
            {' · '}
            {priced ? `ขาย ${baht.format(Number(sheet.sellingPrice))}` : 'ยังไม่ตั้งราคา'}
            {` · ทุน ${baht.format(sheet.totalCost)}`}
          </span>
        </span>
      </TableCell>
      <TableCell className="hidden text-right text-base tabular-nums sm:table-cell">
        {priced ? (
          baht.format(Number(sheet.sellingPrice))
        ) : (
          <span className="text-sm text-muted-foreground">ยังไม่ตั้งราคา</span>
        )}
      </TableCell>
      <TableCell className="hidden text-right text-base tabular-nums sm:table-cell">
        {baht.format(sheet.totalCost)}
      </TableCell>
      <TableCell
        className={cn(
          'text-right text-base font-medium tabular-nums',
          sheet.netProfit < 0 ? 'text-loss' : 'text-profit',
        )}
      >
        {priced && baht.format(sheet.netProfit)}
      </TableCell>
      {/* Above the row link, so the menu opens instead of the sheet. */}
      <TableCell className="relative z-10 w-0 pr-4 pl-1 text-right">
        <div className="flex items-center justify-end gap-2">
          {duplicating && (
            <span role="status" className="text-sm text-muted-foreground">
              กำลังทำสำเนา…
            </span>
          )}
          <RowMenu
            label={`ตัวเลือกของชีต ${sheet.name}`}
            disabled={duplicating}
            items={[
              {
                label: 'เปลี่ยนชื่อ',
                icon: <PencilIcon />,
                onSelect: () => setRenaming(true),
                takesFocus: true,
              },
              {
                label: 'ทำสำเนา',
                icon: <CopyIcon />,
                onSelect: () => startDuplicate(() => duplicateCostSheetAction(sheet.id)),
              },
            ]}
            destructive={{
              label: 'ลบ',
              icon: <Trash2Icon />,
              onSelect: () => setDeleting(true),
              takesFocus: true,
            }}
          />
        </div>
        <ConfirmAction
          open={deleting}
          onOpenChange={setDeleting}
          action={deleteCostSheetAction.bind(null, sheet.id)}
          title={`ลบชีต "${sheet.name}"?`}
          description="ลบแล้วกู้คืนไม่ได้"
          confirmLabel="ลบชีต"
          pendingLabel="กำลังลบ…"
        />
      </TableCell>
    </TableRow>
  )
}
