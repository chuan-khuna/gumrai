import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createCostSheet,
  deleteCostSheet,
  getCostSheet,
  listCostSheets,
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

// Each test makes sheets with names no other test (or the dev seed) uses, and deletes them.
const made: CostSheet[] = []
function uniqueName(label: string) {
  return `${label} ${randomUUID()}`
}
async function make(label: string) {
  const sheet = await createCostSheet(uniqueName(label))
  made.push(sheet)
  return sheet
}
const madeCategories: CostCategory[] = []

afterEach(async () => {
  for (const sheet of made.splice(0)) await deleteCostSheet(sheet.id).catch(() => {})
  for (const c of madeCategories.splice(0)) await deleteCostCategory(c.id).catch(() => {})
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
    const sheet = await createCostSheet(name)
    made.push(sheet)

    expect(sheet).toMatchObject({
      name,
      saleUnit: 'ชิ้น',
      sellingPrice: '0',
      gpPercent: '0',
      vatPercent: '7',
      lines: [],
    })
    expect(await getCostSheet(sheet.id)).toEqual(sheet)
  })

  it('rejects a blank sheet name with a Thai message', async () => {
    await expect(createCostSheet('   ')).rejects.toThrow(CostSheetError)
    await expect(createCostSheet('   ')).rejects.toThrow('ต้องใส่ชื่อชีต')
  })

  it('lists sheets, newest change first, by name and Sale Unit', async () => {
    const older = await make('ชาเขียว')
    const newer = await make('โกโก้')
    await saveCostSheet(older.id, { ...latte(older.name), lines: [] })

    const listed = (await listCostSheets()).filter((s) => [older.id, newer.id].includes(s.id))
    expect(listed.map((s) => s.id)).toEqual([older.id, newer.id])
    expect(listed[0]).toMatchObject({ name: older.name, saleUnit: 'แก้ว' })
  })

  it('saves the sheet and its Manual Lines, and a reload shows them in order', async () => {
    const sheet = await make('ลาเต้')
    const input = latte(uniqueName('มัทฉะลาเต้'))

    const saved = await saveCostSheet(sheet.id, input)
    const reloaded = await getCostSheet(sheet.id)

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
    const saved = await saveCostSheet(sheet.id, {
      ...latte(sheet.name),
      sellingPrice: '59.123456789',
      gpPercent: '32.5',
      vatPercent: '7.25',
      lines: [
        { name: 'ไซรัป', unitCost: '0.0333333333', unit: 'ml', quantityUsed: '12.75', categoryId: null },
      ],
    })

    const reloaded = await getCostSheet(sheet.id)
    expect(reloaded).toEqual(saved)
    expect(reloaded).toMatchObject({ sellingPrice: '59.123456789', gpPercent: '32.5', vatPercent: '7.25' })
    expect(reloaded?.lines[0]).toMatchObject({ unitCost: '0.0333333333', quantityUsed: '12.75' })
  })

  it('replaces the lines as a whole on each save', async () => {
    const sheet = await make('แทนที่')
    await saveCostSheet(sheet.id, latte(sheet.name))

    const lines = [{ name: 'แก้ว', unitCost: '3', unit: 'ชิ้น', quantityUsed: '1', categoryId: null }]
    await saveCostSheet(sheet.id, { ...latte(sheet.name), lines })

    const reloaded = await getCostSheet(sheet.id)
    expect(reloaded?.lines.map((l) => l.name)).toEqual(['แก้ว'])
  })

  it('keeps a Manual Line in its Cost Category', async () => {
    const category = await createCostCategory(uniqueName('บรรจุภัณฑ์'))
    madeCategories.push(category)
    const sheet = await make('หมวด')

    await saveCostSheet(sheet.id, {
      ...latte(sheet.name),
      lines: [{ name: 'ฝา', unitCost: '1', unit: 'ชิ้น', quantityUsed: '1', categoryId: category.id }],
    })

    expect((await getCostSheet(sheet.id))?.lines[0].categoryId).toBe(category.id)
  })

  it('saves nothing when any part of the sheet is invalid', async () => {
    const sheet = await make('ไม่ผ่าน')
    const before = await saveCostSheet(sheet.id, latte(sheet.name))

    const broken = {
      ...latte(uniqueName('เปลี่ยนชื่อ')),
      lines: [
        { name: 'ดี', unitCost: '1', unit: 'g', quantityUsed: '1', categoryId: null },
        { name: 'เสีย', unitCost: 'abc', unit: 'g', quantityUsed: '1', categoryId: null },
      ],
    }
    await expect(saveCostSheet(sheet.id, broken)).rejects.toThrow(CostSheetError)

    expect(await getCostSheet(sheet.id)).toEqual(before)
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
        await expect(saveCostSheet(sheet.id, change(latte(sheet.name)))).rejects.toThrow(message)
      })
    }
  })

  it('says a sheet that no longer exists cannot be saved', async () => {
    const sheet = await make('ลบแล้ว')
    await deleteCostSheet(sheet.id)
    await expect(saveCostSheet(sheet.id, latte(sheet.name))).rejects.toThrow('ไม่พบชีตนี้')
  })

  it('finds no sheet for an unknown or malformed id', async () => {
    expect(await getCostSheet(randomUUID())).toBeNull()
    expect(await getCostSheet('not-an-id')).toBeNull()
  })
})
