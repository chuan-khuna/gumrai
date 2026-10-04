// The sheet calculation: one Cost Sheet's figures, from its Selling Price, GP, VAT and Cost
// Lines. Pure, no I/O, so it runs in the browser and figures update as the seller types.
//
// Ported from matcha-cafe's src/domain/sheet.ts and adapted: Cost Categories are the seller's
// own, open-ended ids (null is ไม่มีหมวด) rather than a fixed three, and every per-sale figure
// is per one Sale Unit rather than per cup. Chart axes are left to the chart code.
// Only Net Profit from a Selling Price is computed; never a price from a profit.

import { platformTake, type DeliveryRates, type PlatformTake } from '@/lib/delivery'

/** One Cost Line, resolved: a Linked Line arrives already carrying its Cost Item's values. */
export interface SheetLineInput {
  id: string
  /** Its Cost Category, or null for ไม่มีหมวด. */
  categoryId: string | null
  name: string
  /** A label only (g, ml, ชิ้น). Changes no arithmetic. */
  unit: string
  /** Baht per Unit. */
  unitCost: number
  /** Units one Sale Unit uses. */
  quantityUsed: number
}

export interface SheetInput {
  /** Baht per Sale Unit, exactly as typed. Never rounded. */
  sellingPrice: number
  /** As typed (33, 32.5); turned into a fraction where it meets the rates. */
  gpPercent: number
  vatPercent: number
  lines: SheetLineInput[]
}

/**
 * A share of something that may be nothing. Null rather than 0 or NaN when the whole is
 * zero: an empty sheet has no proportions, and a 0% would claim it does.
 */
export type Share = number | null

export interface CostedLine extends SheetLineInput {
  /** unitCost x quantityUsed: this line's cost per Sale Unit. */
  cost: number
  shareOfCost: Share
}

export interface CategoryCost {
  /** null is ไม่มีหมวด. */
  categoryId: string | null
  cost: number
  shareOfCost: Share
}

/**
 * One part of the Selling Price. Every part is always present, in drawing order, so a chart
 * and its legend never shift about when a figure drops to zero.
 *
 * `loss` is not a length of its own: it is how far the other parts run past the price. So
 * the shares of everything else sum to 1 + the loss share.
 */
export type PriceSegment = { amount: number; shareOfPrice: Share } & (
  | { kind: 'category'; categoryId: string | null }
  | { kind: 'commission' | 'commissionVat' | 'profit' | 'loss' }
)

export interface SheetResult {
  lines: CostedLine[]
  /** Each Cost Category the lines use, ไม่มีหมวด included, in the order its first line appears. */
  categories: CategoryCost[]
  /** Every line, dearest first. Equal costs keep the order they were entered. */
  ranked: CostedLine[]
  /** The categories, dearest first. Equal costs keep the order of `categories`. */
  rankedCategories: CategoryCost[]
  /** Total cost per Sale Unit. */
  totalCost: number
  /** The typed percentages as fractions. */
  rates: DeliveryRates
  /** What the platform withholds at the Selling Price, and the Net Receipt. */
  platform: PlatformTake
  /**
   * Net Profit per Sale Unit: Net Receipt less the total cost. Unclamped: a price that
   * cannot cover both reports the loss, because 0 would read as "breaks even".
   */
  netProfit: number
  /** The Selling Price opened up, in drawing order. */
  priceSplit: PriceSegment[]
  /**
   * How long the price bar is: everything paid out plus any profit. Equal to the price when
   * the sheet makes money, and longer by exactly the loss when it does not.
   */
  barTotal: number
  /** Cost, GP and the VAT on the GP: more than the price exactly when there is a loss. */
  paidOut: number
  /** `paidOut` as a share of the price. Null when the price is zero. */
  paidOutShare: Share
}

const shareOf = (part: number, whole: number): Share => (whole > 0 ? part / whole : null)

export function computeSheet(sheet: SheetInput): SheetResult {
  const priced = sheet.lines.map((line) => ({ ...line, cost: line.unitCost * line.quantityUsed }))
  const totalCost = priced.reduce((sum, line) => sum + line.cost, 0)
  const lines = priced.map((line) => ({ ...line, shareOfCost: shareOf(line.cost, totalCost) }))

  const categoryIds = [...new Set(lines.map((line) => line.categoryId))]
  const categories = categoryIds.map((categoryId) => {
    const cost = priced
      .filter((line) => line.categoryId === categoryId)
      .reduce((sum, line) => sum + line.cost, 0)
    return { categoryId, cost, shareOfCost: shareOf(cost, totalCost) }
  })

  // Array.prototype.sort is stable, so a tie keeps the order the lines were typed in.
  const ranked = [...lines].sort((a, b) => b.cost - a.cost)
  const rankedCategories = [...categories].sort((a, b) => b.cost - a.cost)

  const rates = { gpRate: sheet.gpPercent / 100, vatRate: sheet.vatPercent / 100 }
  const platform = platformTake(sheet.sellingPrice, rates)
  const netProfit = platform.netReceipt - totalCost

  const profit = Math.max(netProfit, 0)
  const share = (amount: number) => ({ amount, shareOfPrice: shareOf(amount, sheet.sellingPrice) })
  const priceSplit: PriceSegment[] = [
    ...categories.map((c) => ({ kind: 'category' as const, categoryId: c.categoryId, ...share(c.cost) })),
    { kind: 'commission', ...share(platform.commission) },
    { kind: 'commissionVat', ...share(platform.commissionVat) },
    { kind: 'profit', ...share(profit) },
    { kind: 'loss', ...share(Math.max(-netProfit, 0)) },
  ]
  const paidOut = totalCost + platform.totalDeduction

  return {
    lines,
    categories,
    ranked,
    rankedCategories,
    totalCost,
    rates,
    platform,
    netProfit,
    priceSplit,
    barTotal: paidOut + profit,
    paidOut,
    paidOutShare: shareOf(paidOut, sheet.sellingPrice),
  }
}
