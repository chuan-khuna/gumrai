'use client'

import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { categoryLooks, CostRankingChart, PriceSplitChart } from '@/app/sheets/[id]/sheet-charts'
import { saveCostSheetAction, saveManualLineToCostListAction } from '@/app/sheets/actions'
import { UNCATEGORISED } from '@/lib/category-colours'
import { linkLine, unlinkLine } from '@/lib/cost-lines'
import { computeSheet, type Share } from '@/lib/sheet'
import type { CostCategory } from '@/server/cost-categories'
import type { CostItem } from '@/server/cost-items'
import type {
  CostLineInput,
  CostSheet,
  CostSheetInput,
  LinkedLine,
  ManualLine,
} from '@/server/cost-sheets'

// The sheet editor. Edits are held here until the seller presses save; the figures are
// worked out in the browser on every keystroke, with no server round trip.

// A line as the editor holds it. A Linked Line carries its Cost Item's values for display and
// the figures; only its Cost Item and Quantity Used are saved.
type DraftLine = (Omit<ManualLine, 'id'> | Omit<LinkedLine, 'id'>) & { key: string }
type Draft = Omit<CostSheetInput, 'lines'> & { lines: DraftLine[] }

// What saving a Manual Line into the Cost List left to show under the line.
type LineNotice = { kind: 'clash'; item: CostItem } | { kind: 'error'; error: string }

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
    lines: sheet.lines.map(({ id: _, ...line }) => ({ ...line, key: newKey() })),
  }
}

function toLineInput(line: DraftLine): CostLineInput {
  if (line.kind === 'linked') return { costItemId: line.costItemId, quantityUsed: line.quantityUsed }
  const { key: _, kind: __, ...manual } = line
  return manual
}

function toInput(draft: Draft): CostSheetInput {
  return { ...draft, lines: draft.lines.map(toLineInput) }
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

export function SheetEditor({
  saved: initial,
  costItems: initialItems,
  categories,
}: {
  saved: CostSheet
  costItems: CostItem[]
  categories: CostCategory[]
}) {
  const look = useMemo(() => categoryLooks(categories), [categories])
  const [saved, setSaved] = useState(() => toDraft(initial))
  const [draft, setDraft] = useState(saved)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()
  // The Cost List grows when a Manual Line is saved into it, so the add-line search finds it.
  const [costItems, setCostItems] = useState(initialItems)
  // Saving a Manual Line into the Cost List: which line is in flight, and what each line's
  // last attempt left to show (a name clash to resolve, or an error).
  const [savingLineKey, setSavingLineKey] = useState<string | null>(null)
  const [lineNotices, setLineNotices] = useState<Record<string, LineNotice>>({})
  const setLineNotice = (key: string, notice: LineNotice | null) =>
    setLineNotices(({ [key]: _, ...rest }) => (notice ? { ...rest, [key]: notice } : rest))

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
  const changeLine = (key: string, change: (line: DraftLine) => DraftLine) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? change(l) : l)) }))
  // Only a Manual Line's own values are typed; a Linked Line's come from its Cost Item.
  const setLine = (
    key: string,
    fields: { name?: string; unitCost?: string; unit?: string; quantityUsed?: string; categoryId?: string | null },
  ) =>
    changeLine(key, (l) => ({ ...l, ...fields }))
  const appendLine = (line: DraftLine) => setDraft((d) => ({ ...d, lines: [...d.lines, line] }))
  const addManualLine = (name: string) =>
    appendLine({
      key: newKey(),
      kind: 'manual',
      name,
      unitCost: '',
      unit: '',
      quantityUsed: '',
      categoryId: null,
    })
  const addLinkedLine = (item: CostItem) =>
    appendLine({
      key: newKey(),
      kind: 'linked',
      costItemId: item.id,
      name: item.name,
      unitCost: item.unitCost,
      unit: item.unit,
      categoryId: item.categoryId,
      quantityUsed: '',
    })
  // The Manual Line holds the values the line shows now; it is saved with the sheet.
  const unlink = (key: string) =>
    changeLine(key, (l) => (l.kind === 'linked' ? { key: l.key, kind: 'manual', ...unlinkLine(l) } : l))
  const removeLine = (key: string) => {
    setLineNotice(key, null)
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }))
  }
  // The switch to a Linked Line is a draft edit, persisted when the sheet is saved.
  const linkTo = (key: string, item: CostItem) => {
    setLineNotice(key, null)
    changeLine(key, (l) => (l.kind === 'manual' ? { key: l.key, ...linkLine(l, item) } : l))
  }

  // "บันทึกเข้าลิสต์": the Cost Item is created at once, even if the sheet is unsaved.
  async function saveLineToList(line: DraftLine) {
    if (line.kind !== 'manual') return
    setLineNotice(line.key, null)
    setSavingLineKey(line.key)
    try {
      const { key: _, kind: __, ...manual } = line
      const saved = await saveManualLineToCostListAction(manual)
      if (saved.outcome === 'created') {
        setCostItems((items) =>
          [...items, saved.item].sort((a, b) => a.name.localeCompare(b.name)),
        )
        linkTo(line.key, saved.item)
      } else if (saved.outcome === 'clash') {
        setLineNotice(line.key, { kind: 'clash', item: saved.item })
      } else {
        setLineNotice(line.key, { kind: 'error', error: saved.error })
      }
    } finally {
      setSavingLineKey(null)
    }
  }

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
      setLineNotices({}) // the reloaded lines have new keys
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
            <table className="w-full min-w-[54rem] text-left">
              <thead className="text-sm text-muted">
                <tr>
                  <th className="pb-2 font-normal">ที่มา</th>
                  <th className="pb-2 font-normal">ชื่อ</th>
                  <th className="pb-2 font-normal">ต้นทุนต่อหน่วย (฿)</th>
                  <th className="pb-2 font-normal">หน่วย</th>
                  <th className="pb-2 font-normal">หมวด</th>
                  <th className="pb-2 font-normal">ใช้ต่อ{unit}</th>
                  <th className="pb-2 text-right font-normal">ต้นทุนต่อ{unit}</th>
                  <th className="pb-2 text-right font-normal">สัดส่วน</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((line, index) => {
                  const costed = result.lines[index]
                  const linked = line.kind === 'linked'
                  const notice = lineNotices[line.key]
                  return (
                    <Fragment key={line.key}>
                      <tr className={linked ? 'bg-accent/5 align-middle' : 'align-middle'}>
                        <td className="py-1 pr-2">
                          {linked ? (
                            <span className="whitespace-nowrap rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                              ลิงก์ลิสต์
                            </span>
                          ) : (
                            <span className="whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                              พิมพ์เอง
                            </span>
                          )}
                        </td>
                        {linked ? (
                          <>
                            <td className="py-1 pr-2 pl-2">{line.name}</td>
                            <td className="py-1 pr-2 pl-2 tabular-nums">{line.unitCost}</td>
                            <td className="py-1 pr-2 pl-2">{line.unit}</td>
                            {/* A Linked Line's Cost Category is its Cost Item's. */}
                            <td className="py-1 pr-2 pl-2">
                              <span className="flex items-center gap-2 whitespace-nowrap">
                                <CategoryDot colourSlot={look(line.categoryId).colourSlot} />
                                {look(line.categoryId).name}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
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
                              <select
                                aria-label="หมวด"
                                value={line.categoryId ?? ''}
                                onChange={(e) => setLine(line.key, { categoryId: e.target.value || null })}
                                className={cell}
                              >
                                <option value="">{UNCATEGORISED}</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </>
                        )}
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
                        <td className="whitespace-nowrap py-1 text-right">
                          {linked ? (
                            <button
                              type="button"
                              onClick={() => unlink(line.key)}
                              title="เปลี่ยนเป็นรายการพิมพ์เอง โดยเก็บค่าปัจจุบันไว้"
                              className="mr-3 text-sm text-muted"
                            >
                              เลิกลิงก์
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => saveLineToList(line)}
                              disabled={savingLineKey !== null}
                              title="สร้างรายการในลิสต์ต้นทุนจากบรรทัดนี้ แล้วลิงก์บรรทัดนี้กับรายการนั้น"
                              className="mr-3 text-sm text-accent disabled:opacity-60"
                            >
                              {savingLineKey === line.key ? 'กำลังบันทึก…' : 'บันทึกเข้าลิสต์'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="text-sm text-loss"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                      {notice && (
                        <tr>
                          <td colSpan={9} className="pb-2">
                            {notice.kind === 'error' ? (
                              <p role="alert" className="text-sm text-loss">
                                {notice.error}
                              </p>
                            ) : (
                              <div
                                role="alert"
                                className="flex flex-wrap items-center gap-3 rounded border border-line px-3 py-2 text-sm"
                              >
                                <span>
                                  มี &ldquo;{notice.item.name}&rdquo; ในลิสต์ต้นทุนอยู่แล้ว:{' '}
                                  <span className="tabular-nums">
                                    {notice.item.unitCost} ฿/{notice.item.unit}
                                  </span>
                                  , หมวด {look(notice.item.categoryId).name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => linkTo(line.key, notice.item)}
                                  className="rounded bg-accent px-3 py-1 font-medium text-card"
                                >
                                  ลิงก์กับรายการนี้แทน
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLineNotice(line.key, null)}
                                  className="text-muted"
                                >
                                  ไม่ต้อง
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <AddLine costItems={costItems} onPick={addLinkedLine} onAddManual={addManualLine} />
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

      <section className="mt-6 rounded border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">ต้นทุนต่อ{unit} แยกตามหมวด</h2>
        {result.categories.length === 0 ? (
          <p className="text-muted">ยังไม่มีรายการ</p>
        ) : (
          <dl className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 tabular-nums">
            {result.rankedCategories.map((c) => (
              <Fragment key={c.categoryId ?? 'none'}>
                <dt className="flex items-center gap-2">
                  <CategoryDot colourSlot={look(c.categoryId).colourSlot} />
                  {look(c.categoryId).name}
                </dt>
                <dd className="text-right">{baht.format(c.cost)} ฿</dd>
                <dd className="text-right text-sm text-muted">{formatShare(c.shareOfCost)}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </section>

      <section className="mt-6 grid gap-6 rounded border border-line bg-card p-4">
        <PriceSplitChart result={result} look={look} unit={unit} />
        <CostRankingChart result={result} look={look} unit={unit} />
      </section>
    </main>
  )
}

const MAX_MATCHES = 8

// The add-line control: searches the Cost List by name, ignoring case and surrounding spaces.
// Picking an item adds a Linked Line; whatever is typed can always become a Manual Line instead.
function AddLine({
  costItems,
  onPick,
  onAddManual,
}: {
  costItems: CostItem[]
  onPick: (item: CostItem) => void
  onAddManual: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()
  const matches =
    search === '' ? [] : costItems.filter((item) => item.name.toLowerCase().includes(search))

  function done(add: () => void) {
    add()
    setQuery('')
  }

  return (
    <div className="mt-4">
      <label className="block">
        <span className="text-sm text-muted">เพิ่มรายการ</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (matches.length === 1) done(() => onPick(matches[0]))
          }}
          placeholder="ค้นหาในลิสต์ต้นทุน หรือพิมพ์ชื่อใหม่"
          className="mt-1 w-full rounded border border-line bg-card px-3 py-2"
        />
      </label>
      <ul className="mt-2 flex flex-col gap-1">
        {matches.slice(0, MAX_MATCHES).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => done(() => onPick(item))}
              className="flex w-full items-baseline justify-between rounded border border-line px-3 py-2 text-left hover:bg-accent/5"
            >
              <span>{item.name}</span>
              <span className="text-sm tabular-nums text-muted">
                {item.unitCost} ฿/{item.unit}
              </span>
            </button>
          </li>
        ))}
        {matches.length > MAX_MATCHES && (
          <li className="px-3 text-sm text-muted">
            และอีก {matches.length - MAX_MATCHES} รายการ พิมพ์ให้เจาะจงขึ้น
          </li>
        )}
        {search !== '' && matches.length === 0 && (
          <li className="px-3 text-sm text-muted">ไม่พบในลิสต์ต้นทุน</li>
        )}
      </ul>
      <button
        type="button"
        onClick={() => done(() => onAddManual(query.trim()))}
        className="mt-2 rounded border border-line px-4 py-2"
      >
        {search === '' ? '+ เพิ่มรายการพิมพ์เอง' : `+ เพิ่ม "${query.trim()}" เป็นรายการพิมพ์เอง`}
      </button>
    </div>
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
