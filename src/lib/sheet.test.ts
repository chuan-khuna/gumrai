import { describe, expect, it } from 'vitest'
import { platformTake } from '@/lib/delivery'
import { computeSheet, type SheetInput } from '@/lib/sheet'

// Ported from matcha-cafe's src/domain/sheet.test.ts and adapted: Cost Categories are
// open-ended ids (null is ไม่มีหมวด) rather than a fixed three, and the per-cup words are
// per Sale Unit. Every expected figure is worked out from these lines in the comments.
//
//   powder   3 g    x 5.00  = 15.00   ingredients
//   milk     150 ml x 0.075 = 11.25   ingredients
//   cup      1      x 4.50  =  4.50   packaging
//   straw    1      x 0.75  =  0.75   packaging
//   gas      1      x 0.50  =  0.50   ไม่มีหมวด
//                             -----
//                             32.00
const INGREDIENTS = 'cat-ingredients'
const PACKAGING = 'cat-packaging'

const latte: SheetInput = {
  sellingPrice: 100,
  gpPercent: 30,
  vatPercent: 10,
  lines: [
    { id: 'l1', categoryId: INGREDIENTS, name: 'ผงมัทฉะ', unit: 'g', unitCost: 5, quantityUsed: 3 },
    { id: 'l2', categoryId: INGREDIENTS, name: 'นม', unit: 'ml', unitCost: 0.075, quantityUsed: 150 },
    { id: 'l3', categoryId: PACKAGING, name: 'แก้ว', unit: 'ชิ้น', unitCost: 4.5, quantityUsed: 1 },
    { id: 'l4', categoryId: PACKAGING, name: 'หลอด', unit: 'ชิ้น', unitCost: 0.75, quantityUsed: 1 },
    { id: 'l5', categoryId: null, name: 'แก๊ส', unit: 'แก้ว', unitCost: 0.5, quantityUsed: 1 },
  ],
}

describe('what one Sale Unit leaves', () => {
  it('charges VAT on the commission, not on the price', () => {
    // 100 x 30% = 30 commission · 30 x 10% = 3 VAT on it, not 100 x 10% = 10
    const { platform } = computeSheet(latte)
    expect(platform.commission).toBeCloseTo(30, 10)
    expect(platform.commissionVat).toBeCloseTo(3, 10)
    expect(platform.netReceipt).toBeCloseTo(67, 10)
  })

  it('takes 35.31% of the Selling Price at a 33% GP and 7% VAT', () => {
    const grab = computeSheet({ ...latte, gpPercent: 33, vatPercent: 7 })
    expect(grab.platform.takeRate).toBeCloseTo(0.3531, 10)
    expect(grab.platform.totalDeduction).toBeCloseTo(35.31, 10)
  })

  it('reads the typed percentages as the rates they stand for', () => {
    expect(computeSheet({ ...latte, gpPercent: 32.5, vatPercent: 7 }).rates).toEqual({
      gpRate: 0.325,
      vatRate: 0.07,
    })
  })

  it('takes the same deduction as the delivery arithmetic for the same price and rates', () => {
    const grab = computeSheet({ ...latte, sellingPrice: 150, gpPercent: 33, vatPercent: 7 })
    expect(grab.platform).toEqual(platformTake(150, { gpRate: 0.33, vatRate: 0.07 }))
  })

  it('leaves the Net Profit after the platform and the Cost Lines', () => {
    // 100 - 30 - 3 - 32 = 35
    expect(computeSheet(latte).netProfit).toBeCloseTo(35, 10)
  })

  it('leaves exactly nothing when the price only just covers everything', () => {
    // At 0% GP, a price of 32 against 32 of cost.
    expect(computeSheet({ ...latte, sellingPrice: 32, gpPercent: 0 }).netProfit).toBeCloseTo(0, 10)
  })

  it('leaves the price less the cost when selling direct at zero GP', () => {
    const direct = computeSheet({ ...latte, gpPercent: 0 })
    expect(direct.platform.totalDeduction).toBe(0)
    // 100 - 32 = 68
    expect(direct.netProfit).toBeCloseTo(68, 10)
  })

  it('reports a price that cannot cover the cost as a loss, not as zero', () => {
    // 40 - 12 - 1.2 - 32 = -5.2
    expect(computeSheet({ ...latte, sellingPrice: 40 }).netProfit).toBeCloseTo(-5.2, 10)
  })
})

describe('where the Selling Price goes', () => {
  const keys = (sheet: SheetInput) =>
    computeSheet(sheet).priceSplit.map((s) => (s.kind === 'category' ? s.categoryId : s.kind))

  it('splits the price into each Cost Category, the commission, its VAT and the profit', () => {
    const expected = [
      [INGREDIENTS, 26.25],
      [PACKAGING, 5.25],
      [null, 0.5],
      ['commission', 30],
      ['commissionVat', 3],
      ['profit', 35],
      ['loss', 0],
    ] as const
    const actual = computeSheet(latte).priceSplit
    expect(keys(latte)).toEqual(expected.map(([key]) => key))
    actual.forEach((s, i) => expect(s.amount).toBeCloseTo(expected[i][1], 10))
  })

  it('shares out exactly the whole price when the sheet makes money', () => {
    const split = computeSheet(latte).priceSplit
    const drawn = split
      .filter((s) => s.kind !== 'loss')
      .reduce((sum, s) => sum + (s.shareOfPrice ?? 0), 0)
    // 26.25 + 5.25 + 0.5 + 30 + 3 + 35 = 100 of 100
    expect(drawn).toBeCloseTo(1, 10)
    expect(split.find((s) => s.kind === 'profit')?.shareOfPrice).toBeCloseTo(0.35, 10)
  })

  it('adds up what the price pays out: cost, GP and the VAT on the GP', () => {
    // 32 cost + 30 commission + 3 VAT = 65 of 100
    const { paidOut, paidOutShare } = computeSheet(latte)
    expect(paidOut).toBeCloseTo(65, 10)
    expect(paidOutShare).toBeCloseTo(0.65, 10)
  })

  it('runs past the whole price by exactly the loss when the sheet loses money', () => {
    // At 40: 32 cost + 12 commission + 1.2 VAT = 45.2 paid out against 40, 5.2 short.
    const { barTotal, priceSplit } = computeSheet({ ...latte, sellingPrice: 40 })
    expect(priceSplit.find((s) => s.kind === 'profit')?.amount).toBe(0)
    expect(priceSplit.find((s) => s.kind === 'loss')?.amount).toBeCloseTo(5.2, 10)
    expect(barTotal).toBeCloseTo(45.2, 10)
    const lossShare = priceSplit.find((s) => s.kind === 'loss')?.shareOfPrice ?? 0
    expect(lossShare).toBeCloseTo(0.13, 10)
    const paidOut = priceSplit
      .filter((s) => s.kind !== 'profit' && s.kind !== 'loss')
      .reduce((sum, s) => sum + (s.shareOfPrice ?? 0), 0)
    expect(paidOut).toBeCloseTo(1 + lossShare, 10)
  })

  it('reports shares of a zero price as blank, not as infinities', () => {
    const free = computeSheet({ ...latte, sellingPrice: 0 })
    expect(free.priceSplit.every((s) => s.shareOfPrice === null)).toBe(true)
    expect(free.paidOutShare).toBeNull()
    expect(free.netProfit).toBe(-32)
  })

  it('keeps every part of the split even at zero, so the chart never shifts about', () => {
    expect(keys({ ...latte, gpPercent: 0 })).toEqual([
      INGREDIENTS,
      PACKAGING,
      null,
      'commission',
      'commissionVat',
      'profit',
      'loss',
    ])
  })
})

describe('which cost is dearest', () => {
  it('ranks every line dearest first, across Cost Categories', () => {
    const { ranked } = computeSheet({ ...latte, lines: [...latte.lines].reverse() })
    expect(ranked.map((line) => line.name)).toEqual(['ผงมัทฉะ', 'นม', 'แก้ว', 'หลอด', 'แก๊ส'])
  })

  it('keeps lines that cost the same in the order they were entered', () => {
    const { ranked } = computeSheet({
      ...latte,
      lines: [
        { id: 'a', categoryId: null, name: 'ล้าง', unit: 'แก้ว', unitCost: 1, quantityUsed: 1 },
        { id: 'b', categoryId: PACKAGING, name: 'ฝา', unit: 'ชิ้น', unitCost: 0.5, quantityUsed: 2 },
        { id: 'c', categoryId: INGREDIENTS, name: 'ไซรัป', unit: 'g', unitCost: 0.25, quantityUsed: 4 },
      ],
    })
    expect(ranked.map((line) => line.id)).toEqual(['a', 'b', 'c'])
  })

  it('ranks the Cost Categories dearest first', () => {
    // ไม่มีหมวด becomes 0.5 x 40 = 20, dearer than packaging's 5.25
    const { rankedCategories } = computeSheet({
      ...latte,
      lines: [{ ...latte.lines[4], quantityUsed: 40 }, ...latte.lines.slice(0, 4)],
    })
    expect(rankedCategories.map((c) => c.categoryId)).toEqual([INGREDIENTS, null, PACKAGING])
  })
})

describe('what one Sale Unit costs', () => {
  it('costs each line as Unit Cost times Quantity Used', () => {
    const result = computeSheet(latte)
    expect(result.lines.map((line) => line.cost)).toEqual([15, 11.25, 4.5, 0.75, 0.5])
    expect(result.totalCost).toBeCloseTo(32, 10)
  })

  it('subtotals each Cost Category, ไม่มีหมวด included, as a share of the cost', () => {
    const { categories } = computeSheet(latte)
    // 26.25 of 32 · 5.25 of 32 · 0.5 of 32
    expect(categories.map((c) => c.categoryId)).toEqual([INGREDIENTS, PACKAGING, null])
    expect(categories.map((c) => c.cost)).toEqual([26.25, 5.25, 0.5])
    expect(categories.map((c) => c.shareOfCost)).toEqual([0.8203125, 0.1640625, 0.015625])
  })

  it('lists the Cost Categories in the order their first line appears', () => {
    const { categories } = computeSheet({ ...latte, lines: [...latte.lines].reverse() })
    expect(categories.map((c) => c.categoryId)).toEqual([null, PACKAGING, INGREDIENTS])
  })

  it('gives each line its share of the cost, and the shares account for all of it', () => {
    const { lines } = computeSheet(latte)
    // 15 / 32 = 0.46875
    expect(lines[0].shareOfCost).toBe(0.46875)
    expect(lines.reduce((total, line) => total + (line.shareOfCost ?? 0), 0)).toBeCloseTo(1, 10)
  })

  it('reports shares of an empty sheet as blank, not as NaN', () => {
    const result = computeSheet({ ...latte, lines: [] })
    expect(result.totalCost).toBe(0)
    expect(result.categories).toEqual([])
    expect(result.netProfit).toBeCloseTo(67, 10)
  })

  it('reports line shares as blank when every line costs nothing', () => {
    const result = computeSheet({
      ...latte,
      lines: [{ ...latte.lines[0], unitCost: 0 }, { ...latte.lines[4], quantityUsed: 0 }],
    })
    expect(result.lines.map((line) => line.shareOfCost)).toEqual([null, null])
    expect(result.categories.map((c) => c.shareOfCost)).toEqual([null, null])
  })
})
