import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  countCostItemsIn,
  createCostCategory,
  deleteCostCategory,
  listCostCategories,
  renameCostCategory,
  type CostCategory,
} from '@/server/costs/cost-categories'
import {
  countSheetsUsingCostItem,
  createCostItem,
  deleteCostItem,
  getCostItem,
  listCostItems,
  updateCostItem,
  type CostItem,
} from '@/server/costs/cost-items'
import {
  createCostSheet,
  deleteCostSheet,
  duplicateCostSheet,
  getCostSheet,
  listCostSheets,
  renameCostSheet,
  saveCostSheet,
  type CostSheet,
} from '@/server/costs/cost-sheets'
import type { Db } from '@/server/db/supabase'
import { createSeller, removeSellers } from '@/server/testing/test-sellers'

// Row-level security: Seller B cannot see or touch anything Seller A owns, through any
// operation, even knowing its id.

let a: Db
let b: Db
let category: CostCategory
let item: CostItem
let sheet: CostSheet

beforeEach(async () => {
  ;[a, b] = await Promise.all([createSeller('A').then((s) => s.db), createSeller('B').then((s) => s.db)])
  category = await createCostCategory(a, 'ของ A')
  item = await createCostItem(a, { name: 'มัทฉะ', unitCost: '4', unit: 'g', categoryId: category.id })
  sheet = await createCostSheet(a, 'ชีตของ A')
  sheet = await saveCostSheet(a, sheet.id, {
    name: sheet.name,
    saleUnit: 'แก้ว',
    sellingPrice: '65',
    gpPercent: '0',
    vatPercent: '7',
    lines: [{ costItemId: item.id, quantityUsed: '4' }],
  })
})
afterEach(removeSellers)

// What A still has, unchanged, after B's attempt.
async function expectAUntouched() {
  expect(await getCostItem(a, item.id)).toEqual(item)
  expect((await listCostCategories(a)).find((c) => c.id === category.id)).toEqual(category)
  expect(await getCostSheet(a, sheet.id)).toEqual(sheet)
}

describe("Seller B and Seller A's Cost Items", () => {
  it('cannot list or read them', async () => {
    expect(await listCostItems(b)).toEqual([])
    expect(await getCostItem(b, item.id)).toBeNull()
    expect(await countSheetsUsingCostItem(b, item.id)).toBe(0)
  })

  it('cannot change them', async () => {
    await expect(updateCostItem(b, item.id, { name: 'ของ B', unitCost: '0', unit: 'g' })).rejects.toThrow(
      'ไม่พบรายการนี้',
    )
    await expectAUntouched()
  })

  it('cannot delete them', async () => {
    await deleteCostItem(b, item.id)
    await expectAUntouched()
  })

  it('may use the same name for their own', async () => {
    const own = await createCostItem(b, { name: ' มัทฉะ ', unitCost: '5', unit: 'g' })

    expect(own.name).toBe('มัทฉะ')
    expect((await listCostItems(b)).map((i) => i.id)).toEqual([own.id])
  })
})

describe("Seller B and Seller A's Cost Categories", () => {
  it('cannot list them, and has only their own starting three', async () => {
    const own = await listCostCategories(b)

    expect(own.map((c) => c.name)).toEqual(['วัตถุดิบ', 'บรรจุภัณฑ์', 'อื่น ๆ'])
    expect(own.map((c) => c.id)).not.toContain(category.id)
    expect(await countCostItemsIn(b, category.id)).toBe(0)
  })

  it('cannot rename or delete them', async () => {
    await expect(renameCostCategory(b, category.id, 'ของ B')).rejects.toThrow('ไม่พบหมวดนี้')
    await deleteCostCategory(b, category.id)
    await expectAUntouched()
  })

  it('cannot put their own Cost Item in one', async () => {
    await expect(
      createCostItem(b, { name: 'นม', unitCost: '1', unit: 'ml', categoryId: category.id }),
    ).rejects.toThrow('ไม่พบหมวดนี้')
    expect(await listCostItems(b)).toEqual([])
  })
})

describe("Seller B and Seller A's Cost Sheets", () => {
  it('cannot list or read them', async () => {
    expect(await listCostSheets(b)).toEqual([])
    expect(await getCostSheet(b, sheet.id)).toBeNull()
  })

  it('cannot save, rename, duplicate or delete them', async () => {
    await expect(
      saveCostSheet(b, sheet.id, {
        name: 'ของ B',
        saleUnit: 'ชิ้น',
        sellingPrice: '1',
        gpPercent: '0',
        vatPercent: '0',
        lines: [],
      }),
    ).rejects.toThrow('ไม่พบชีตนี้')
    await expect(renameCostSheet(b, sheet.id, 'ของ B')).rejects.toThrow('ไม่พบชีตนี้')
    await expect(duplicateCostSheet(b, sheet.id)).rejects.toThrow('ไม่พบชีตนี้')
    await deleteCostSheet(b, sheet.id)

    await expectAUntouched()
    expect(await listCostSheets(b)).toEqual([])
    expect(await listCostSheets(a)).toHaveLength(1)
  })

  it("cannot link a Cost Line on their own sheet to A's Cost Item", async () => {
    const own = await createCostSheet(b, 'ชีตของ B')

    await expect(
      saveCostSheet(b, own.id, {
        name: own.name,
        saleUnit: 'แก้ว',
        sellingPrice: '65',
        gpPercent: '0',
        vatPercent: '7',
        lines: [{ costItemId: item.id, quantityUsed: '4' }],
      }),
    ).rejects.toThrow('ไม่พบรายการต้นทุนนี้ในลิสต์')
    expect((await getCostSheet(b, own.id))?.lines).toEqual([])
  })

  it("cannot put a Manual Line on their own sheet in A's Cost Category", async () => {
    const own = await createCostSheet(b, 'ชีตของ B')

    await expect(
      saveCostSheet(b, own.id, {
        name: own.name,
        saleUnit: 'แก้ว',
        sellingPrice: '65',
        gpPercent: '0',
        vatPercent: '7',
        lines: [{ name: 'น้ำแข็ง', unitCost: '0.01', unit: 'g', quantityUsed: '100', categoryId: category.id }],
      }),
    ).rejects.toThrow('ไม่พบหมวดนี้')
  })
})
