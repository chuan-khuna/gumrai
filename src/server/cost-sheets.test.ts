import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createCostSheet,
  deleteCostSheet,
  duplicateCostSheet,
  getCostSheet,
  listCostSheets,
  renameCostSheet,
  saveCostSheet,
  CostSheetError,
  type CostSheet,
  type CostSheetInput,
} from '@/server/cost-sheets'
import {
  createCostCategory,
  deleteCostCategory,
  type CostCategory,
} from '@/server/cost-categories'
import {
  createCostItem,
  deleteCostItem,
  updateCostItem,
  type CostItem,
  type CostItemInput,
} from '@/server/cost-items'
import { unlinkLine } from '@/lib/cost-lines'
import { createServerClient } from '@/server/supabase'

// The secret-key client the app itself uses until sign-in lands (ticket 02).
const db = createServerClient()

// Each test makes sheets with names no other test (or the dev seed) uses, and deletes them.
const made: CostSheet[] = []
function uniqueName(label: string) {
  return `${label} ${randomUUID()}`
}
async function make(label: string) {
  const sheet = await createCostSheet(db, uniqueName(label))
  made.push(sheet)
  return sheet
}
const madeCategories: CostCategory[] = []
const madeItems: CostItem[] = []
async function makeItem(input: CostItemInput) {
  const item = await createCostItem(db, { ...input, name: uniqueName(input.name) })
  madeItems.push(item)
  return item
}

afterEach(async () => {
  for (const sheet of made.splice(0)) await deleteCostSheet(db, sheet.id).catch(() => {})
  // Sheets first: a Cost Item that a line still links to cannot be deleted.
  for (const item of madeItems.splice(0)) await deleteCostItem(db, item.id).catch(() => {})
  for (const c of madeCategories.splice(0)) await deleteCostCategory(db, c.id).catch(() => {})
})

const latte = (name: string): CostSheetInput => ({
  name,
  saleUnit: 'แก้ว',
  sellingPrice: '65',
  gpPercent: '33',
  vatPercent: '7',
  lines: [
    { name: 'มัทฉะ', unitCost: '4', unit: 'g', quantityUsed: '4', categoryId: null },
    { name: 'นมสด', unitCost: '0.075', unit: 'ml', quantityUsed: '150', categoryId: null },
  ],
})

describe('Cost Sheets', () => {
  it('creates a named sheet with ชิ้น as its Sale Unit, 0% GP, 7% VAT and no lines', async () => {
    const name = uniqueName('มัทฉะลาเต้')
    const sheet = await createCostSheet(db, name)
    made.push(sheet)

    expect(sheet).toMatchObject({
      name,
      saleUnit: 'ชิ้น',
      sellingPrice: '0',
      gpPercent: '0',
      vatPercent: '7',
      lines: [],
    })
    expect(await getCostSheet(db, sheet.id)).toEqual(sheet)
  })

  it('rejects a blank sheet name with a Thai message', async () => {
    await expect(createCostSheet(db, '   ')).rejects.toThrow(CostSheetError)
    await expect(createCostSheet(db, '   ')).rejects.toThrow('ต้องใส่ชื่อชีต')
  })

  it('lists sheets, newest change first, by name and Sale Unit', async () => {
    const older = await make('ชาเขียว')
    const newer = await make('โกโก้')
    await saveCostSheet(db, older.id, { ...latte(older.name), lines: [] })

    const listed = (await listCostSheets(db)).filter((s) => [older.id, newer.id].includes(s.id))
    expect(listed.map((s) => s.id)).toEqual([older.id, newer.id])
    expect(listed[0]).toMatchObject({ name: older.name, saleUnit: 'แก้ว' })
  })

  it('saves the sheet and its Manual Lines, and a reload shows them in order', async () => {
    const sheet = await make('ลาเต้')
    const input = latte(uniqueName('มัทฉะลาเต้'))

    const saved = await saveCostSheet(db, sheet.id, input)
    const reloaded = await getCostSheet(db, sheet.id)

    expect(reloaded).toEqual(saved)
    expect(reloaded).toMatchObject({
      id: sheet.id,
      name: input.name,
      saleUnit: 'แก้ว',
      sellingPrice: '65',
      gpPercent: '33',
      vatPercent: '7',
    })
    expect(reloaded?.lines.map(({ id: _, ...line }) => line)).toEqual(
      input.lines.map((line) => ({ kind: 'manual', ...line })),
    )
  })

  it('round-trips decimal values exactly, the Selling Price unrounded', async () => {
    const sheet = await make('ทศนิยม')
    const saved = await saveCostSheet(db, sheet.id, {
      ...latte(sheet.name),
      sellingPrice: '59.123456789',
      gpPercent: '32.5',
      vatPercent: '7.25',
      lines: [
        { name: 'ไซรัป', unitCost: '0.0333333333', unit: 'ml', quantityUsed: '12.75', categoryId: null },
      ],
    })

    const reloaded = await getCostSheet(db, sheet.id)
    expect(reloaded).toEqual(saved)
    expect(reloaded).toMatchObject({ sellingPrice: '59.123456789', gpPercent: '32.5', vatPercent: '7.25' })
    expect(reloaded?.lines[0]).toMatchObject({ unitCost: '0.0333333333', quantityUsed: '12.75' })
  })

  it('replaces the lines as a whole on each save', async () => {
    const sheet = await make('แทนที่')
    await saveCostSheet(db, sheet.id, latte(sheet.name))

    const lines = [{ name: 'แก้ว', unitCost: '3', unit: 'ชิ้น', quantityUsed: '1', categoryId: null }]
    await saveCostSheet(db, sheet.id, { ...latte(sheet.name), lines })

    const reloaded = await getCostSheet(db, sheet.id)
    expect(reloaded?.lines.map((l) => l.name)).toEqual(['แก้ว'])
  })

  it('keeps a Manual Line in its Cost Category', async () => {
    const category = await createCostCategory(db, uniqueName('บรรจุภัณฑ์'))
    madeCategories.push(category)
    const sheet = await make('หมวด')

    await saveCostSheet(db, sheet.id, {
      ...latte(sheet.name),
      lines: [{ name: 'ฝา', unitCost: '1', unit: 'ชิ้น', quantityUsed: '1', categoryId: category.id }],
    })

    expect((await getCostSheet(db, sheet.id))?.lines[0].categoryId).toBe(category.id)
  })

  it('saves nothing when any part of the sheet is invalid', async () => {
    const sheet = await make('ไม่ผ่าน')
    const before = await saveCostSheet(db, sheet.id, latte(sheet.name))

    const broken = {
      ...latte(uniqueName('เปลี่ยนชื่อ')),
      lines: [
        { name: 'ดี', unitCost: '1', unit: 'g', quantityUsed: '1', categoryId: null },
        { name: 'เสีย', unitCost: 'abc', unit: 'g', quantityUsed: '1', categoryId: null },
      ],
    }
    await expect(saveCostSheet(db, sheet.id, broken)).rejects.toThrow(CostSheetError)

    expect(await getCostSheet(db, sheet.id)).toEqual(before)
  })

  describe('rejects invalid values with a Thai message', () => {
    const cases: [string, (input: CostSheetInput) => CostSheetInput, string][] = [
      ['a blank name', (i) => ({ ...i, name: ' ' }), 'ต้องใส่ชื่อชีต'],
      ['a blank Sale Unit', (i) => ({ ...i, saleUnit: ' ' }), 'ต้องใส่หน่วยขาย'],
      ['a Selling Price that is not a number', (i) => ({ ...i, sellingPrice: '1e3' }), 'ราคาขายต้องเป็นตัวเลข'],
      ['a negative Selling Price', (i) => ({ ...i, sellingPrice: '-1' }), 'ราคาขายติดลบไม่ได้'],
      ['a negative GP', (i) => ({ ...i, gpPercent: '-5' }), 'GP ติดลบไม่ได้'],
      ['a VAT that is not a number', (i) => ({ ...i, vatPercent: 'x' }), 'VAT ต้องเป็นตัวเลข'],
      [
        'a line with no name',
        (i) => ({ ...i, lines: [{ ...i.lines[0], name: ' ' }] }),
        'ต้องใส่ชื่อรายการ',
      ],
      [
        'a line with a negative Unit Cost',
        (i) => ({ ...i, lines: [{ ...i.lines[0], unitCost: '-1' }] }),
        'ต้นทุนต่อหน่วยติดลบไม่ได้',
      ],
      [
        'a line with no Unit',
        (i) => ({ ...i, lines: [{ ...i.lines[0], unit: '' }] }),
        'ต้องใส่หน่วย',
      ],
      [
        'a line whose Quantity Used is not a number',
        (i) => ({ ...i, lines: [{ ...i.lines[0], quantityUsed: '' }] }),
        'ปริมาณที่ใช้ต้องเป็นตัวเลข',
      ],
    ]
    for (const [what, change, message] of cases) {
      it(what, async () => {
        const sheet = await make('ตรวจ')
        await expect(saveCostSheet(db, sheet.id, change(latte(sheet.name)))).rejects.toThrow(message)
      })
    }
  })

  it('says a sheet that no longer exists cannot be saved', async () => {
    const sheet = await make('ลบแล้ว')
    await deleteCostSheet(db, sheet.id)
    await expect(saveCostSheet(db, sheet.id, latte(sheet.name))).rejects.toThrow('ไม่พบชีตนี้')
  })

  it('finds no sheet for an unknown or malformed id', async () => {
    expect(await getCostSheet(db, randomUUID())).toBeNull()
    expect(await getCostSheet(db, 'not-an-id')).toBeNull()
  })

  describe('Linked Lines', () => {
    it("saves a Linked Line, and a reload resolves it to its Cost Item's values", async () => {
      const category = await createCostCategory(db, uniqueName('วัตถุดิบ'))
      madeCategories.push(category)
      const matcha = await makeItem({ name: 'มัทฉะ', unitCost: '4', unit: 'g', categoryId: category.id })
      const sheet = await make('ลิงก์')

      const saved = await saveCostSheet(db, sheet.id, {
        ...latte(sheet.name),
        lines: [
          { costItemId: matcha.id, quantityUsed: '4' },
          { name: 'แก้ว', unitCost: '3', unit: 'ชิ้น', quantityUsed: '1', categoryId: null },
        ],
      })

      expect(await getCostSheet(db, sheet.id)).toEqual(saved)
      expect(saved.lines.map(({ id: _, ...line }) => line)).toEqual([
        {
          kind: 'linked',
          costItemId: matcha.id,
          name: matcha.name,
          unitCost: '4',
          unit: 'g',
          categoryId: category.id,
          quantityUsed: '4',
        },
        { kind: 'manual', name: 'แก้ว', unitCost: '3', unit: 'ชิ้น', quantityUsed: '1', categoryId: null },
      ])
    })

    it("shows a Cost Item's changed Unit Cost when the sheet is next loaded", async () => {
      const milk = await makeItem({ name: 'นมสด', unitCost: '0.075', unit: 'ml' })
      const sheet = await make('ราคาเปลี่ยน')
      await saveCostSheet(db, sheet.id, {
        ...latte(sheet.name),
        lines: [{ costItemId: milk.id, quantityUsed: '150' }],
      })

      await updateCostItem(db, milk.id, { name: milk.name, unitCost: '0.08', unit: 'ml' })

      expect((await getCostSheet(db, sheet.id))?.lines[0]).toMatchObject({
        kind: 'linked',
        costItemId: milk.id,
        unitCost: '0.08',
        quantityUsed: '150',
      })
    })

    it('unlinks a Linked Line into a Manual Line holding its current values', async () => {
      const category = await createCostCategory(db, uniqueName('วัตถุดิบ'))
      madeCategories.push(category)
      const matcha = await makeItem({ name: 'มัทฉะ', unitCost: '4', unit: 'g', categoryId: category.id })
      const sheet = await make('เลิกลิงก์')
      const saved = await saveCostSheet(db, sheet.id, {
        ...latte(sheet.name),
        lines: [{ costItemId: matcha.id, quantityUsed: '4' }],
      })
      const line = saved.lines[0]
      if (line.kind !== 'linked') throw new Error('expected a Linked Line')

      await saveCostSheet(db, sheet.id, { ...latte(sheet.name), lines: [unlinkLine(line)] })
      // Now its own values: a later Cost Item change leaves it alone.
      await updateCostItem(db, matcha.id, { name: matcha.name, unitCost: '5', unit: 'g' })

      const reloaded = await getCostSheet(db, sheet.id)
      expect(reloaded?.lines.map(({ id: _, ...line }) => line)).toEqual([
        {
          kind: 'manual',
          name: matcha.name,
          unitCost: '4',
          unit: 'g',
          quantityUsed: '4',
          categoryId: category.id,
        },
      ])
    })

    it('says a Linked Line whose Cost Item does not exist cannot be saved', async () => {
      const sheet = await make('ไม่มีรายการ')
      for (const costItemId of [randomUUID(), 'not-an-id']) {
        await expect(
          saveCostSheet(db, sheet.id, { ...latte(sheet.name), lines: [{ costItemId, quantityUsed: '1' }] }),
        ).rejects.toThrow('ไม่พบรายการต้นทุนนี้')
      }
    })

    it("rejects a Linked Line's Quantity Used that is not a number", async () => {
      const matcha = await makeItem({ name: 'มัทฉะ', unitCost: '4', unit: 'g' })
      const sheet = await make('ตรวจลิงก์')
      await expect(
        saveCostSheet(db, sheet.id, {
          ...latte(sheet.name),
          lines: [{ costItemId: matcha.id, quantityUsed: 'สี่' }],
        }),
      ).rejects.toThrow('ปริมาณที่ใช้ต้องเป็นตัวเลข')
    })
  })

  describe('Sheet management', () => {
    const withoutIds = (sheet: CostSheet) => sheet.lines.map(({ id: _, ...line }) => line)

    it('renames a sheet, trimmed, and keeps everything else', async () => {
      const sheet = await make('ชื่อเดิม')
      const saved = await saveCostSheet(db, sheet.id, latte(sheet.name))
      const name = uniqueName('ชื่อใหม่')

      const renamed = await renameCostSheet(db, sheet.id, `  ${name}  `)

      expect(renamed).toEqual({ ...saved, name })
      expect(await getCostSheet(db, sheet.id)).toEqual(renamed)
    })

    it('rejects a blank name, and a sheet that no longer exists', async () => {
      const sheet = await make('ชื่อว่าง')
      await expect(renameCostSheet(db, sheet.id, '   ')).rejects.toThrow('ต้องใส่ชื่อชีต')
      await expect(renameCostSheet(db, randomUUID(), 'x')).rejects.toThrow('ไม่พบชีตนี้')
      await expect(renameCostSheet(db, 'not-an-id', 'x')).rejects.toThrow('ไม่พบชีตนี้')
    })

    it('duplicates a sheet as "(สำเนา)", its Manual Lines copied and Linked Lines still linked', async () => {
      const matcha = await makeItem({ name: 'มัทฉะ', unitCost: '4', unit: 'g' })
      const sheet = await make('หน้าร้าน')
      const original = await saveCostSheet(db, sheet.id, {
        ...latte(sheet.name),
        lines: [
          { costItemId: matcha.id, quantityUsed: '4' },
          { name: 'นมสด', unitCost: '0.075', unit: 'ml', quantityUsed: '150', categoryId: null },
        ],
      })

      const copy = await duplicateCostSheet(db, sheet.id)
      made.push(copy)

      expect(copy.id).not.toBe(original.id)
      expect(copy).toMatchObject({
        name: `${original.name} (สำเนา)`,
        saleUnit: original.saleUnit,
        sellingPrice: original.sellingPrice,
        gpPercent: original.gpPercent,
        vatPercent: original.vatPercent,
      })
      expect(withoutIds(copy)).toEqual(withoutIds(original))
      expect(copy.lines[0]).toMatchObject({ kind: 'linked', costItemId: matcha.id })
      expect(copy.lines[1]).toMatchObject({ kind: 'manual' })
      expect(await getCostSheet(db, copy.id)).toEqual(copy)
      expect((await listCostSheets(db)).map((s) => s.id)).toContain(copy.id)
    })

    it('editing a duplicate leaves the original untouched', async () => {
      const matcha = await makeItem({ name: 'มัทฉะ', unitCost: '4', unit: 'g' })
      const sheet = await make('หน้าร้าน')
      const original = await saveCostSheet(db, sheet.id, {
        ...latte(sheet.name),
        lines: [
          { costItemId: matcha.id, quantityUsed: '4' },
          { name: 'นมสด', unitCost: '0.075', unit: 'ml', quantityUsed: '150', categoryId: null },
        ],
      })
      const copy = await duplicateCostSheet(db, sheet.id)
      made.push(copy)

      await saveCostSheet(db, copy.id, {
        name: uniqueName('Grab'),
        saleUnit: 'กล่อง',
        sellingPrice: '79',
        gpPercent: '30',
        vatPercent: '7',
        lines: [{ costItemId: matcha.id, quantityUsed: '5' }],
      })
      await renameCostSheet(db, copy.id, uniqueName('Grab อีกชื่อ'))

      expect(await getCostSheet(db, sheet.id)).toEqual(original)
    })

    it("a duplicate's Linked Lines still follow Unit Cost changes", async () => {
      const matcha = await makeItem({ name: 'มัทฉะ', unitCost: '4', unit: 'g' })
      const sheet = await make('หน้าร้าน')
      await saveCostSheet(db, sheet.id, {
        ...latte(sheet.name),
        lines: [{ costItemId: matcha.id, quantityUsed: '4' }],
      })
      const copy = await duplicateCostSheet(db, sheet.id)
      made.push(copy)

      await updateCostItem(db, matcha.id, { name: matcha.name, unitCost: '4.5', unit: 'g' })

      expect((await getCostSheet(db, copy.id))!.lines[0]).toMatchObject({
        kind: 'linked',
        unitCost: '4.5',
      })
      expect((await getCostSheet(db, sheet.id))!.lines[0]).toMatchObject({ unitCost: '4.5' })
    })

    it('says a sheet that no longer exists cannot be duplicated', async () => {
      await expect(duplicateCostSheet(db, randomUUID())).rejects.toThrow('ไม่พบชีตนี้')
      await expect(duplicateCostSheet(db, 'not-an-id')).rejects.toThrow('ไม่พบชีตนี้')
    })

    it('deletes a sheet, and deleting a missing one does nothing', async () => {
      const sheet = await make('ลบ')
      await deleteCostSheet(db, sheet.id)
      expect(await getCostSheet(db, sheet.id)).toBeNull()
      await expect(deleteCostSheet(db, sheet.id)).resolves.toBeUndefined()
    })
  })
})
