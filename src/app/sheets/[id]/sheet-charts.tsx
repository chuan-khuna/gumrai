'use client'

import { barX, defineChart, ruleX, text } from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { Chart } from '@tanstack/react-charts'
import { useMemo, useState } from 'react'
import { categoryColour, UNCATEGORISED } from '@/lib/category-colours'
import type { PriceSegment, Share, SheetResult } from '@/lib/sheet'
import type { CostCategory } from '@/server/cost-categories'

// The sheet's two charts, drawn from the calculation module's output (@/lib/sheet) and nothing
// else: costs ranked dearest first, and where the Selling Price goes. Exact figures are in the
// tables beside them; the charts only show proportion.

const baht = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat('th-TH', { style: 'percent', maximumFractionDigits: 1 })

/** How a Cost Category, or ไม่มีหมวด (null), is labelled and coloured. */
export type CategoryLook = { name: string; colourSlot: number | null; colour: string }

export function categoryLooks(categories: CostCategory[]) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  return (categoryId: string | null): CategoryLook => {
    const category = categoryId === null ? undefined : byId.get(categoryId)
    // A category deleted since the page loaded reads as ไม่มีหมวด, as it now is.
    if (!category) return { name: UNCATEGORISED, colourSlot: null, colour: categoryColour(null) }
    return { name: category.name, colourSlot: category.colourSlot, colour: categoryColour(category.colourSlot) }
  }
}

type RankRow = { key: string; label: string; cost: number; colour: string }

export function CostRankingChart({
  result,
  look,
  unit,
}: {
  result: SheetResult
  look: (categoryId: string | null) => CategoryLook
  unit: string
}) {
  const [by, setBy] = useState<'line' | 'category'>('line')
  const rows: RankRow[] = useMemo(
    () =>
      by === 'line'
        ? result.ranked.map((line) => ({
            key: line.id,
            label: line.name.trim() || '(ไม่มีชื่อ)',
            cost: line.cost,
            colour: look(line.categoryId).colour,
          }))
        : result.rankedCategories.map((c) => ({
            key: c.categoryId ?? 'none',
            label: look(c.categoryId).name,
            cost: c.cost,
            colour: look(c.categoryId).colour,
          })),
    [by, result, look],
  )

  const definition = useMemo(() => {
    const labels = new Map(rows.map((row) => [row.key, row.label]))
    // Any positive end, so an empty or all-zero ranking (shown as the empty state) still makes a valid axis.
    const dearest = Math.max(0, ...rows.map((row) => row.cost)) || 1
    return defineChart({
      marks: [
        barX(rows, { x: 'cost', y: 'key', fill: (row) => row.colour, radius: { end: 3 } }),
        text(rows, {
          x: 'cost',
          y: 'key',
          text: (row) => `${baht.format(row.cost)} ฿`,
          anchor: 'start',
          dx: 6,
          fontSize: 12,
        }),
      ],
      scales: {
        x: {
          // Headroom past the dearest bar for its label.
          scale: scaleLinear().domain([0, dearest * 1.3]),
          grid: true,
          axis: { ticks: { count: 4, format: (value: number) => baht.format(value) } },
        },
        y: {
          scale: scaleBand<string>().domain(rows.map((row) => row.key)).padding(0.25),
          axis: { ticks: { format: (key: string) => labels.get(key) ?? '' } },
        },
      },
    })
  }, [rows])

  const empty = result.lines.length === 0 || result.totalCost <= 0
  const tab = (value: typeof by, label: string) => (
    <button
      type="button"
      onClick={() => setBy(value)}
      aria-pressed={by === value}
      className={`rounded px-3 py-1 text-sm ${by === value ? 'bg-accent text-card' : 'border border-line text-muted'}`}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-medium">ต้นทุนต่อ{unit} จากแพงไปถูก</h3>
        {tab('line', 'ตามรายการ')}
        {tab('category', 'ตามหมวด')}
      </div>
      {empty ? (
        <p className="text-muted">ยังไม่มีต้นทุนให้จัดอันดับ</p>
      ) : (
        <Chart
          definition={definition}
          height={rows.length * 36 + 48}
          ariaLabel={by === 'line' ? 'ต้นทุนแต่ละรายการ จากแพงไปถูก' : 'ต้นทุนแต่ละหมวด จากแพงไปถูก'}
        />
      )}
    </div>
  )
}

type SplitRow = { key: string; label: string; amount: number; share: number; x1: number; x2: number; colour: string }

const PRICE_ROW = 'ราคาขาย'

function segmentLook(
  segment: PriceSegment,
  look: (categoryId: string | null) => CategoryLook,
): { name: string; colour: string } {
  switch (segment.kind) {
    case 'category':
      return look(segment.categoryId)
    case 'commission':
      return { name: 'ค่าคอม GP', colour: 'var(--color-commission)' }
    case 'commissionVat':
      return { name: 'VAT ของค่าคอม', colour: 'var(--color-commission-vat)' }
    case 'profit':
      return { name: 'กำไรสุทธิ', colour: 'var(--color-profit)' }
    case 'loss':
      return { name: 'ขาดทุน', colour: 'var(--color-loss)' }
  }
}

export function PriceSplitChart({
  result,
  look,
  unit,
}: {
  result: SheetResult
  look: (categoryId: string | null) => CategoryLook
  unit: string
}) {
  // A zero price has no shares to draw (they are null), and with no lines there is no cost to
  // show against it.
  const empty = result.paidOutShare === null || result.lines.length === 0

  const { rows, loss } = useMemo(() => {
    let end = 0
    const rows: SplitRow[] = []
    let loss: SplitRow | null = null
    for (const segment of result.priceSplit) {
      const share = segment.shareOfPrice ?? 0
      const { name, colour } = segmentLook(segment, look)
      const key = segment.kind === 'category' ? `category-${segment.categoryId ?? 'none'}` : segment.kind
      if (segment.kind === 'loss') {
        // Not a length of its own: how far everything paid out runs past the price.
        if (segment.amount > 0) {
          loss = { key, label: name, amount: segment.amount, share, x1: 1, x2: 1 + share, colour }
        }
        continue
      }
      rows.push({ key, label: name, amount: segment.amount, share, x1: end, x2: end + share, colour })
      end += share
    }
    return { rows, loss }
  }, [result, look])

  const definition = useMemo(() => {
    const drawn = rows.filter((row) => row.amount > 0)
    const right = Math.max(1, loss?.x2 ?? 1)
    return defineChart({
      marks: [
        barX(drawn, { x1: 'x1', x2: 'x2', y: () => PRICE_ROW, fill: (row) => row.colour }),
        barX(loss ? [loss] : [], {
          x1: 'x1',
          x2: 'x2',
          y: () => PRICE_ROW,
          fill: 'none',
          stroke: 'var(--color-loss)',
          strokeWidth: 2,
          strokeDasharray: '5 3',
        }),
        // The Selling Price itself: 100%.
        ruleX([1], { stroke: 'var(--color-ink)', strokeOpacity: 1, strokeWidth: 2 }),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([0, right]),
          nice: true,
          grid: true,
          axis: { ticks: { format: (value: number) => percent.format(value) } },
        },
        y: { scale: scaleBand<string>().domain([PRICE_ROW]).padding(0.15), axis: false },
      },
    })
  }, [rows, loss])

  return (
    <div>
      <h3 className="mb-3 font-medium">ราคาขายต่อ{unit} ไปไหนบ้าง</h3>
      {empty ? (
        <p className="text-muted">ใส่ราคาขายและรายการต้นทุน แล้วจะเห็นว่าราคาขายไปไหนบ้าง</p>
      ) : (
        <>
          <Chart
            definition={definition}
            height={96}
            ariaLabel="ราคาขายแบ่งเป็นต้นทุนแต่ละหมวด ค่าคอม GP VAT ของค่าคอม และกำไรสุทธิ"
          />
          {loss && (
            <p className="mt-1 text-sm text-loss">
              ต้นทุนและค่าแพลตฟอร์มเกินราคาขาย {percent.format(loss.share)} (เส้นประเลยเส้น 100%)
            </p>
          )}
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {[...rows, ...(loss ? [loss] : [])].map((row) => (
              <li key={row.key} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-3 shrink-0 rounded-sm"
                  style={{ background: row.colour }}
                />
                <span className="mr-auto">{row.label}</span>
                <span className="tabular-nums">{baht.format(row.amount)} ฿</span>
                <span className="w-14 text-right tabular-nums text-muted">{formatShare(row.share)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const formatShare = (share: Share) => (share === null ? '' : percent.format(share))
