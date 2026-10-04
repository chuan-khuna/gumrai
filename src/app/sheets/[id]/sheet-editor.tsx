'use client'

import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { categoryLooks, CostRankingChart, PriceSplitChart } from '@/app/sheets/[id]/sheet-charts'
import { saveCostSheetAction, saveManualLineToCostListAction } from '@/app/sheets/actions'
import { Field } from '@/components/field'
import { OptionSelect } from '@/components/option-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  const cell = 'h-9 px-2'

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/sheets"
        className="text-sm text-muted-foreground hover:text-foreground"
        onNavigate={(event) => {
          if (dirty && !window.confirm(LEAVE_WARNING)) event.preventDefault()
        }}
      >
        ← ชีตต้นทุน
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{draft.name.trim() || 'ชีตต้นทุน'}</h1>
        {dirty && (
          <span className="flex items-center gap-1.5 text-sm text-unsaved">
            <span aria-hidden className="size-2 rounded-full bg-primary-edge" />
            ยังไม่บันทึก
          </span>
        )}
        <Button type="button" onClick={save} disabled={saving || !dirty} className="ml-auto">
          {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-loss-surface px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <Card className="mt-6">
        <CardContent className="grid gap-4 sm:grid-cols-5">
          <Field label="ชื่อชีต" className="sm:col-span-2">
            <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="หน่วยขาย">
            <Input
              value={draft.saleUnit}
              onChange={(e) => set({ saleUnit: e.target.value })}
              placeholder="แก้ว, กล่อง"
            />
          </Field>
          <Field label={`ราคาขายต่อ${unit} (฿)`}>
            <Input
              value={draft.sellingPrice}
              onChange={(e) => set({ sellingPrice: e.target.value })}
              inputMode="decimal"
              className="text-right tabular-nums"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="GP (%)">
              <Input
                value={draft.gpPercent}
                onChange={(e) => set({ gpPercent: e.target.value })}
                inputMode="decimal"
                className="text-right tabular-nums"
              />
            </Field>
            <Field label="VAT (%)">
              <Input
                value={draft.vatPercent}
                onChange={(e) => set({ vatPercent: e.target.value })}
                inputMode="decimal"
                className="text-right tabular-nums"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>รายการต้นทุน</CardTitle>
        </CardHeader>
        <CardContent>
          {draft.lines.length === 0 ? (
            <p className="text-muted-foreground">ยังไม่มีรายการ</p>
          ) : (
            <Table className="min-w-[54rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>ที่มา</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ต้นทุนต่อหน่วย (฿)</TableHead>
                  <TableHead>หน่วย</TableHead>
                  <TableHead>หมวด</TableHead>
                  <TableHead>ใช้ต่อ{unit}</TableHead>
                  <TableHead className="text-right">ต้นทุนต่อ{unit}</TableHead>
                  <TableHead className="text-right">สัดส่วน</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.lines.map((line, index) => {
                  const costed = result.lines[index]
                  const linked = line.kind === 'linked'
                  const notice = lineNotices[line.key]
                  return (
                    <Fragment key={line.key}>
                      <TableRow className={linked ? 'bg-linked/40 hover:bg-linked/60' : undefined}>
                        <TableCell>
                          {linked ? (
                            <Badge variant="linked">ลิงก์ลิสต์</Badge>
                          ) : (
                            <Badge variant="manual">พิมพ์เอง</Badge>
                          )}
                        </TableCell>
                        {linked ? (
                          <>
                            <TableCell>{line.name}</TableCell>
                            <TableCell className="tabular-nums">{line.unitCost}</TableCell>
                            <TableCell>{line.unit}</TableCell>
                            {/* A Linked Line's Cost Category is its Cost Item's. */}
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <CategoryDot colourSlot={look(line.categoryId).colourSlot} />
                                {look(line.categoryId).name}
                              </span>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <Input
                                aria-label="ชื่อ"
                                value={line.name}
                                onChange={(e) => setLine(line.key, { name: e.target.value })}
                                className={cell}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                aria-label="ต้นทุนต่อหน่วย"
                                value={line.unitCost}
                                onChange={(e) => setLine(line.key, { unitCost: e.target.value })}
                                inputMode="decimal"
                                className={`${cell} text-right tabular-nums`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                aria-label="หน่วย"
                                value={line.unit}
                                onChange={(e) => setLine(line.key, { unit: e.target.value })}
                                placeholder="g, ml"
                                className={cell}
                              />
                            </TableCell>
                            <TableCell>
                              <OptionSelect
                                size="sm"
                                aria-label="หมวด"
                                value={line.categoryId ?? ''}
                                onValueChange={(value) => setLine(line.key, { categoryId: value || null })}
                                options={[
                                  { value: '', label: UNCATEGORISED, dot: null },
                                  ...categories.map((c) => ({ value: c.id, label: c.name, dot: c.colourSlot })),
                                ]}
                                className="w-full"
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Input
                            aria-label={`ใช้ต่อ${unit}`}
                            value={line.quantityUsed}
                            onChange={(e) => setLine(line.key, { quantityUsed: e.target.value })}
                            inputMode="decimal"
                            className={`${cell} text-right tabular-nums`}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{baht.format(costed.cost)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatShare(costed.shareOfCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {linked ? (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => unlink(line.key)}
                              title="เปลี่ยนเป็นรายการพิมพ์เอง โดยเก็บค่าปัจจุบันไว้"
                            >
                              เลิกลิงก์
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => saveLineToList(line)}
                              disabled={savingLineKey !== null}
                              title="สร้างรายการในลิสต์ต้นทุนจากบรรทัดนี้ แล้วลิงก์บรรทัดนี้กับรายการนั้น"
                              className="text-link"
                            >
                              {savingLineKey === line.key ? 'กำลังบันทึก…' : 'บันทึกเข้าลิสต์'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => removeLine(line.key)}
                            className="text-destructive hover:bg-loss-surface"
                          >
                            ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                      {notice && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={9} className="whitespace-normal pb-3">
                            {notice.kind === 'error' ? (
                              <p role="alert" className="text-sm text-loss">
                                {notice.error}
                              </p>
                            ) : (
                              <div
                                role="alert"
                                className="flex flex-wrap items-center gap-3 rounded-lg bg-linked px-4 py-3 text-sm"
                              >
                                <span>
                                  มี &ldquo;{notice.item.name}&rdquo; ในลิสต์ต้นทุนอยู่แล้ว:{' '}
                                  <span className="tabular-nums">
                                    {notice.item.unitCost} ฿/{notice.item.unit}
                                  </span>
                                  , หมวด {look(notice.item.categoryId).name}
                                </span>
                                <Button
                                  variant="keep"
                                  size="sm"
                                  onClick={() => linkTo(line.key, notice.item)}
                                >
                                  ลิงก์กับรายการนี้แทน
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setLineNotice(line.key, null)}
                                >
                                  ไม่ต้อง
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <AddLine costItems={costItems} onPick={addLinkedLine} onAddManual={addManualLine} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>ผลลัพธ์ต่อ{unit}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
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
            </dl>
            <NetProfit
              label={isLoss ? `ขาดทุนต่อ${unit}` : `กำไรสุทธิต่อ${unit}`}
              value={netProfit}
              share={profitSegment?.shareOfPrice ?? null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ต้นทุนต่อ{unit} แยกตามหมวด</CardTitle>
          </CardHeader>
          <CardContent>
            {result.categories.length === 0 ? (
              <p className="text-muted-foreground">ยังไม่มีรายการ</p>
            ) : (
              <dl className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 tabular-nums">
                {result.rankedCategories.map((c) => (
                  <Fragment key={c.categoryId ?? 'none'}>
                    <dt className="flex items-center gap-2">
                      <CategoryDot colourSlot={look(c.categoryId).colourSlot} />
                      {look(c.categoryId).name}
                    </dt>
                    <dd className="text-right">{baht.format(c.cost)} ฿</dd>
                    <dd className="text-right text-sm text-muted-foreground">{formatShare(c.shareOfCost)}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-8">
          <PriceSplitChart result={result} look={look} unit={unit} />
          <CostRankingChart result={result} look={look} unit={unit} />
        </CardContent>
      </Card>
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
    <div className="mt-6">
      <Field label="เพิ่มรายการ">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (matches.length === 1) done(() => onPick(matches[0]))
          }}
          placeholder="ค้นหาในลิสต์ต้นทุน หรือพิมพ์ชื่อใหม่"
        />
      </Field>
      <ul className="mt-2 flex flex-col gap-1">
        {matches.slice(0, MAX_MATCHES).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => done(() => onPick(item))}
              className="flex w-full items-baseline justify-between rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-linked focus-visible:bg-linked focus-visible:ring-3 focus-visible:ring-ring"
            >
              <span>{item.name}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {item.unitCost} ฿/{item.unit}
              </span>
            </button>
          </li>
        ))}
        {matches.length > MAX_MATCHES && (
          <li className="px-3 text-sm text-muted-foreground">
            และอีก {matches.length - MAX_MATCHES} รายการ พิมพ์ให้เจาะจงขึ้น
          </li>
        )}
        {search !== '' && matches.length === 0 && (
          <li className="px-3 text-sm text-muted-foreground">ไม่พบในลิสต์ต้นทุน</li>
        )}
      </ul>
      <Button
        type="button"
        variant="outline"
        onClick={() => done(() => onAddManual(query.trim()))}
        className="mt-2"
      >
        {search === '' ? '+ เพิ่มรายการพิมพ์เอง' : `+ เพิ่ม "${query.trim()}" เป็นรายการพิมพ์เอง`}
      </Button>
    </div>
  )
}

function Figure({ label, value, share = null }: { label: string; value: number; share?: Share }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{baht.format(value)} ฿</dd>
      <dd className="text-right text-sm text-muted-foreground">{formatShare(share)}</dd>
    </>
  )
}

// The one big figure on the sheet: mint for a profit, cinnamon for a loss. A loss also says
// ขาดทุน in its label and carries a minus sign, so colour never carries it alone.
function NetProfit({ label, value, share }: { label: string; value: number; share: Share }) {
  const isLoss = value < 0
  return (
    <div className={`grid gap-1 rounded-2xl p-5 ${isLoss ? 'bg-loss-surface' : 'bg-profit-surface'}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-heading text-5xl leading-tight font-semibold tabular-nums ${isLoss ? 'text-loss' : 'text-profit'}`}
      >
        {isLoss ? '−' : ''}
        {baht.format(Math.abs(value))}
        <span className="ml-1 text-xl font-medium">฿</span>
      </span>
      {share !== null && (
        <span className="text-sm text-muted-foreground">{formatShare(share)} ของราคาขาย</span>
      )}
    </div>
  )
}
