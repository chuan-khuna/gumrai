'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { saveCostSheetAction } from '@/app/sheets/actions'
import { computeSheet, type Share } from '@/lib/sheet'
import type { CostSheet, CostSheetInput, ManualLineInput } from '@/server/cost-sheets'

// The sheet editor. Edits are held here until the seller presses save; the figures are
// worked out in the browser on every keystroke, with no server round trip.

type DraftLine = ManualLineInput & { key: string }
type Draft = Omit<CostSheetInput, 'lines'> & { lines: DraftLine[] }

const LEAVE_WARNING = 'มีการแก้ไขที่ยังไม่บันทึก ออกจากหน้านี้เลยไหม'

let nextKey = 0
const newKey = () => `line-${nextKey++}`

function toDraft(sheet: CostSheet): Draft {
  return {
    name: sheet.name,
    saleUnit: sheet.saleUnit,
    sellingPrice: sheet.sellingPrice,
    gpPercent: sheet.gpPercent,
    vatPercent: sheet.vatPercent,
    lines: sheet.lines.map(({ id: _, kind: __, ...line }) => ({ ...line, key: newKey() })),
  }
}

function toInput(draft: Draft): CostSheetInput {
  return { ...draft, lines: draft.lines.map(({ key: _, ...line }) => line) }
}

// What the seller has typed, as a number for the live figures. Anything that is not yet a
// plain decimal counts as 0 until it is; saving is what rejects it.
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)$/
function toNumber(text: string) {
  const trimmed = text.trim()
  return DECIMAL.test(trimmed) ? Number(trimmed) : 0
}

const baht = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat('th-TH', { style: 'percent', maximumFractionDigits: 2 })

// A share is blank when its whole is zero, never an error or a 0%.
const formatShare = (share: Share) => (share === null ? '' : percent.format(share))

export function SheetEditor({ saved: initial }: { saved: CostSheet }) {
  const [saved, setSaved] = useState(() => toDraft(initial))
  const [draft, setDraft] = useState(saved)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const dirty = JSON.stringify(toInput(draft)) !== JSON.stringify(toInput(saved))
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  // Ask before the tab closes or reloads with unsaved edits.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const result = useMemo(
    () =>
      computeSheet({
        sellingPrice: toNumber(draft.sellingPrice),
        gpPercent: toNumber(draft.gpPercent),
        vatPercent: toNumber(draft.vatPercent),
        lines: draft.lines.map((line) => ({
          id: line.key,
          categoryId: line.categoryId,
          name: line.name,
          unit: line.unit,
          unitCost: toNumber(line.unitCost),
          quantityUsed: toNumber(line.quantityUsed),
        })),
      }),
    [draft],
  )

  const unit = draft.saleUnit.trim() || 'ชิ้น'
  const set = (fields: Partial<Draft>) => setDraft((d) => ({ ...d, ...fields }))
  const setLine = (key: string, fields: Partial<DraftLine>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...fields } : l)) }))
  const addLine = () =>
    setDraft((d) => ({
      ...d,
      lines: [
        ...d.lines,
        { key: newKey(), name: '', unitCost: '', unit: '', quantityUsed: '', categoryId: null },
      ],
    }))
  const removeLine = (key: string) =>
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }))

  function save() {
    setError(null)
    startSaving(async () => {
      const outcome = await saveCostSheetAction(initial.id, toInput(draft))
      if (outcome.error !== null) {
        setError(outcome.error)
        return
      }
      const next = toDraft(outcome.sheet)
      setSaved(next)
      setDraft(next)
    })
  }

  const netProfit = result.netProfit
  const isLoss = netProfit < 0
  const profitSegment = result.priceSplit.find((s) => s.kind === (isLoss ? 'loss' : 'profit'))
  const field = 'mt-1 w-full rounded border border-line bg-card px-3 py-2'
  const cell = 'w-full rounded border border-line bg-card px-2 py-1'

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/sheets"
        className="text-sm text-muted"
        onNavigate={(event) => {
          if (dirty && !window.confirm(LEAVE_WARNING)) event.preventDefault()
        }}
      >
        ← ชีตต้นทุน
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{draft.name.trim() || 'ชีตต้นทุน'}</h1>
        {dirty && <span className="text-sm text-loss">● ยังไม่บันทึก</span>}
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="ml-auto rounded bg-accent px-4 py-2 font-medium text-card disabled:opacity-60"
        >
          {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-loss">
          {error}
        </p>
      )}

      <section className="mt-6 grid gap-3 rounded border border-line bg-card p-4 sm:grid-cols-5">
        <label className="block sm:col-span-2">
          <span className="text-sm text-muted">ชื่อชีต</span>
          <input value={draft.name} onChange={(e) => set({ name: e.target.value })} className={field} />
        </label>
        <label className="block">
          <span className="text-sm text-muted">หน่วยขาย</span>
          <input
            value={draft.saleUnit}
            onChange={(e) => set({ saleUnit: e.target.value })}
            placeholder="แก้ว, กล่อง"
            className={field}
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">ราคาขายต่อ{unit} (฿)</span>
          <input
            value={draft.sellingPrice}
            onChange={(e) => set({ sellingPrice: e.target.value })}
            inputMode="decimal"
            className={field}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-muted">GP (%)</span>
            <input
              value={draft.gpPercent}
              onChange={(e) => set({ gpPercent: e.target.value })}
              inputMode="decimal"
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">VAT (%)</span>
            <input
              value={draft.vatPercent}
              onChange={(e) => set({ vatPercent: e.target.value })}
              inputMode="decimal"
              className={field}
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">รายการต้นทุน</h2>
        {draft.lines.length === 0 ? (
          <p className="text-muted">ยังไม่มีรายการ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead className="text-sm text-muted">
                <tr>
                  <th className="pb-2 font-normal">ชื่อ</th>
                  <th className="pb-2 font-normal">ต้นทุนต่อหน่วย (฿)</th>
                  <th className="pb-2 font-normal">หน่วย</th>
                  <th className="pb-2 font-normal">ใช้ต่อ{unit}</th>
                  <th className="pb-2 text-right font-normal">ต้นทุนต่อ{unit}</th>
                  <th className="pb-2 text-right font-normal">สัดส่วน</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((line, index) => {
                  const costed = result.lines[index]
                  return (
                    <tr key={line.key} className="align-middle">
                      <td className="py-1 pr-2">
                        <input
                          aria-label="ชื่อ"
                          value={line.name}
                          onChange={(e) => setLine(line.key, { name: e.target.value })}
                          className={cell}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          aria-label="ต้นทุนต่อหน่วย"
                          value={line.unitCost}
                          onChange={(e) => setLine(line.key, { unitCost: e.target.value })}
                          inputMode="decimal"
                          className={cell}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          aria-label="หน่วย"
                          value={line.unit}
                          onChange={(e) => setLine(line.key, { unit: e.target.value })}
                          placeholder="g, ml"
                          className={cell}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          aria-label={`ใช้ต่อ${unit}`}
                          value={line.quantityUsed}
                          onChange={(e) => setLine(line.key, { quantityUsed: e.target.value })}
                          inputMode="decimal"
                          className={cell}
                        />
                      </td>
                      <td className="py-1 pr-2 text-right tabular-nums">{baht.format(costed.cost)}</td>
                      <td className="py-1 pr-2 text-right tabular-nums text-muted">
                        {formatShare(costed.shareOfCost)}
                      </td>
                      <td className="py-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="text-sm text-loss"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <button type="button" onClick={addLine} className="mt-3 rounded border border-line px-4 py-2">
          + เพิ่มรายการพิมพ์เอง
        </button>
      </section>

      <section className="mt-6 rounded border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">ผลลัพธ์ต่อ{unit}</h2>
        <dl className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 tabular-nums">
          <Figure label={`ต้นทุนรวมต่อ${unit}`} value={result.totalCost} />
          <Figure
            label={`ค่าคอม GP ต่อ${unit}`}
            value={result.platform.commission}
            share={result.priceSplit.find((s) => s.kind === 'commission')?.shareOfPrice ?? null}
          />
          <Figure
            label={`VAT ของค่าคอมต่อ${unit}`}
            value={result.platform.commissionVat}
            share={result.priceSplit.find((s) => s.kind === 'commissionVat')?.shareOfPrice ?? null}
          />
          <Figure label={`เงินที่ได้รับจริงต่อ${unit}`} value={result.platform.netReceipt} />
          <Figure
            label={isLoss ? `ขาดทุนต่อ${unit}` : `กำไรต่อ${unit}`}
            value={Math.abs(netProfit)}
            share={profitSegment?.shareOfPrice ?? null}
            tone={isLoss ? 'loss' : 'profit'}
          />
        </dl>
      </section>
    </main>
  )
}

function Figure({
  label,
  value,
  share = null,
  tone,
}: {
  label: string
  value: number
  share?: Share
  tone?: 'profit' | 'loss'
}) {
  const colour = tone === 'loss' ? 'text-loss' : tone === 'profit' ? 'text-profit' : ''
  return (
    <>
      <dt className={tone ? `font-medium ${colour}` : 'text-muted'}>{label}</dt>
      <dd className={`text-right ${tone ? `font-semibold ${colour}` : ''}`}>{baht.format(value)} ฿</dd>
      <dd className="text-right text-sm text-muted">{formatShare(share)}</dd>
    </>
  )
}
