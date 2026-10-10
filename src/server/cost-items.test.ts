import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  countSheetsUsingCostItem,
  createCostItem,
  deleteCostItem,
  getCostItem,
  listCostItems,
  saveManualLineToCostList,
  updateCostItem,
  CostListError,
  type CostItem,
  type CostItemInput,
} from '@/server/cost-items'
import {
  createCostCategory,
  deleteCostCategory,
  type CostCategory,
} from '@/server/cost-categories'
import {
  createCostSheet,
  deleteCostSheet,
  getCostSheet,
  saveCostSheet,
  type CostSheet,
  type CostSheetInput,
  type ManualLineInput,
} from '@/server/cost-sheets'
import { linkLine } from '@/lib/cost-lines'
import { computeSheet } from '@/lib/sheet'
import { createServerClient } from '@/server/supabase'

// The secret-key client the app itself uses until sign-in lands (ticket 02).
const db = createServerClient()

// Each test makes names no other test (or the dev seed) uses, and deletes what it made.
const made: CostItem[] = []
function uniqueName(label: string) {
  return `${label} ${randomUUID()}`
}
async function make(input: CostItemInput) {
  const item = await createCostItem(db, input)
  made.push(item)
  return item
}
const madeCategories: CostCategory[] = []
async function makeCategory(label: string) {
  const category = await createCostCategory(db, uniqueName(label))
  madeCategories.push(category)
  return category
}

const madeSheets: CostSheet[] = []

afterEach(async () => {
  // Sheets first: a Cost Item that a line still links to cannot be deleted.
  for (const sheet of madeSheets.splice(0)) await deleteCostSheet(db, sheet.id).catch(() => {})
  for (const item of made.splice(0)) {
    await deleteCostItem(db, item.id).catch(() => {})
  }
  for (const category of madeCategories.splice(0)) {
    await deleteCostCategory(db, category.id).catch(() => {})
  }
})

describe('Cost Items', () => {
  it('creates a Cost Item that then appears in the list', async () => {
    const name = uniqueName('มัทฉะ')
    const item = await make({ name, unitCost: '4', unit: 'g' })

    expect(item).toMatchObject({ name, unitCost: '4', unit: 'g' })
    expect(await listCostItems(db)).toContainEqual(item)
  })

  it('keeps a decimal Unit Cost exact', async () => {
    const item = await make({ name: uniqueName('นมสด'), unitCost: '0.075', unit: 'ml' })
    expect(item.unitCost).toBe('0.075')
  })

  it('saves the name without surrounding spaces', async () => {
    const name = uniqueName('แก้ว')
    const item = await make({ name: `  ${name}  `, unitCost: '2.5', unit: 'ชิ้น' })
    expect(item.name).toBe(name)
  })

  it('rejects a Unit Cost that is not a number', async () => {
    for (const unitCost of ['abc', '', '  ', '4 บาท', '1e3', '0x10']) {
      await expect(make({ name: uniqueName('x'), unitCost, unit: 'g' })).rejects.toThrow(
        'ต้นทุนต่อหน่วยต้องเป็นตัวเลข',
      )
    }
  })

  it('rejects a negative Unit Cost', async () => {
    await expect(make({ name: uniqueName('x'), unitCost: '-0.5', unit: 'g' })).rejects.toThrow(
      'ต้นทุนต่อหน่วยติดลบไม่ได้',
    )
  })

  it('accepts a zero Unit Cost', async () => {
    const item = await make({ name: uniqueName('น้ำเปล่า'), unitCost: '0', unit: 'ml' })
    expect(item.unitCost).toBe('0')
  })

  it('rejects a blank name or Unit', async () => {
    await expect(make({ name: '  ', unitCost: '1', unit: 'g' })).rejects.toThrow('ต้องใส่ชื่อ')
    await expect(make({ name: uniqueName('x'), unitCost: '1', unit: ' ' })).rejects.toThrow(
      'ต้องใส่หน่วย',
    )
  })

  describe('rejects a duplicate name with a Thai message', () => {
    for (const [variant, rename] of [
      ['the same name', (n: string) => n],
      ['a different case', (n: string) => n.toUpperCase()],
      ['surrounding spaces', (n: string) => `   ${n}  `],
      ['case and spaces together', (n: string) => ` ${n.toUpperCase()} `],
    ] as const) {
      it(`on create, with ${variant}`, async () => {
        const name = uniqueName('Matcha')
        await make({ name, unitCost: '4', unit: 'g' })

        const attempt = make({ name: rename(name), unitCost: '5', unit: 'g' })
        await expect(attempt).rejects.toThrow(CostListError)
        await expect(attempt).rejects.toThrow('มีรายการชื่อนี้อยู่แล้ว')
      })

      it(`on rename, with ${variant}`, async () => {
        const taken = uniqueName('Milk')
        await make({ name: taken, unitCost: '0.06', unit: 'ml' })
        const other = await make({ name: uniqueName('Cup'), unitCost: '3', unit: 'ชิ้น' })

        const attempt = updateCostItem(db, other.id, { name: rename(taken), unitCost: '3', unit: 'ชิ้น' })
        await expect(attempt).rejects.toThrow(CostListError)
        await expect(attempt).rejects.toThrow('มีรายการชื่อนี้อยู่แล้ว')
        expect((await listCostItems(db)).find((i) => i.id === other.id)).toEqual(other)
      })
    }
  })

  it('updates a Cost Item, and the list shows the saved values', async () => {
    const item = await make({ name: uniqueName('มัทฉะ'), unitCost: '4', unit: 'g' })
    const name = uniqueName('มัทฉะ เกรดพิธี')

    const updated = await updateCostItem(db, item.id, { name, unitCost: '4.25', unit: 'กรัม' })

    expect(updated).toEqual({ id: item.id, name, unitCost: '4.25', unit: 'กรัม', categoryId: null })
    expect((await listCostItems(db)).find((i) => i.id === item.id)).toEqual(updated)
  })

  it('lets a Cost Item keep its own name in a different case', async () => {
    const name = uniqueName('matcha')
    const item = await make({ name, unitCost: '4', unit: 'g' })

    const updated = await updateCostItem(db, item.id, { name: name.toUpperCase(), unitCost: '4', unit: 'g' })

    expect(updated.name).toBe(name.toUpperCase())
  })

  it('validates the Unit Cost on update too', async () => {
    const item = await make({ name: uniqueName('x'), unitCost: '1', unit: 'g' })
    await expect(updateCostItem(db, item.id, { ...item, unitCost: '-1' })).rejects.toThrow(
      'ต้นทุนต่อหน่วยติดลบไม่ได้',
    )
  })

  it('gets one Cost Item by id, for its edit form', async () => {
    const item = await make({ name: uniqueName('ไซรัป'), unitCost: '0.4', unit: 'ml' })
    expect(await getCostItem(db, item.id)).toEqual(item)
    expect(await getCostItem(db, 'not-an-id')).toBeNull()
  })

  it('deletes a Cost Item, and it leaves the list', async () => {
    const item = await make({ name: uniqueName('ซอง'), unitCost: '1', unit: 'ซอง' })

    await deleteCostItem(db, item.id)

    expect((await listCostItems(db)).map((i) => i.id)).not.toContain(item.id)
    expect(await getCostItem(db, item.id)).toBeNull()
  })

  it('frees a deleted name for a new Cost Item', async () => {
    const name = uniqueName('หลอด')
    const item = await make({ name, unitCost: '0.5', unit: 'ชิ้น' })
    await deleteCostItem(db, item.id)

    const again = await make({ name, unitCost: '0.6', unit: 'ชิ้น' })

    expect(again.name).toBe(name)
  })

  describe('Cost Category', () => {
    it('is none unless one is picked', async () => {
      const item = await make({ name: uniqueName('น้ำแข็ง'), unitCost: '0.02', unit: 'g' })
      expect(item.categoryId).toBeNull()
    })

    it('can be picked on create, changed on update, and cleared back to none', async () => {
      const ingredients = await makeCategory('วัตถุดิบ')
      const packaging = await makeCategory('บรรจุภัณฑ์')
      const input = { name: uniqueName('ฝาโดม'), unitCost: '1.2', unit: 'ชิ้น' }

      const item = await make({ ...input, categoryId: ingredients.id })
      expect(item.categoryId).toBe(ingredients.id)

      const moved = await updateCostItem(db, item.id, { ...input, categoryId: packaging.id })
      expect(moved.categoryId).toBe(packaging.id)
      expect(await getCostItem(db, item.id)).toEqual(moved)

      const cleared = await updateCostItem(db, item.id, { ...input, categoryId: null })
      expect(cleared.categoryId).toBeNull()
    })

    it('rejects a Cost Category that does not exist, with a Thai message', async () => {
      const gone = await makeCategory('ลบแล้ว')
      await deleteCostCategory(db, gone.id)
      const input = { name: uniqueName('x'), unitCost: '1', unit: 'g' }

      for (const categoryId of [gone.id, 'not-an-id']) {
        await expect(make({ ...input, categoryId })).rejects.toThrow('ไม่พบหมวดนี้ อาจถูกลบไปแล้ว')
      }
    })

    it('filters the list to one Cost Category, or to ไม่มีหมวด', async () => {
      const tag = randomUUID()
      const syrups = await makeCategory('ไซรัป')
      const vanilla = await make({ name: `วานิลลา ${tag}`, unitCost: '0.4', unit: 'ml', categoryId: syrups.id })
      const ice = await make({ name: `น้ำแข็ง ${tag}`, unitCost: '0.02', unit: 'g' })

      const inSyrups = await listCostItems(db, { categoryId: syrups.id })
      expect(inSyrups).toEqual([vanilla])

      const uncategorised = await listCostItems(db, { search: tag, categoryId: null })
      expect(uncategorised).toEqual([ice])
    })
  })

  describe('searching by name', () => {
    it('lists only names containing the search, ignoring case and surrounding spaces', async () => {
      const tag = randomUUID()
      const makro = await make({ name: `นมสด (Makro) ${tag}`, unitCost: '0.06', unit: 'ml' })
      const cp = await make({ name: `นมสด (CP) ${tag}`, unitCost: '0.07', unit: 'ml' })
      const cup = await make({ name: `แก้ว ${tag}`, unitCost: '3', unit: 'ชิ้น' })

      const found = await listCostItems(db, { search: `  ${tag.toUpperCase()} ` })
      expect(found.map((i) => i.id).sort()).toEqual([makro.id, cp.id, cup.id].sort())

      const milk = await listCostItems(db, { search: 'นมสด (makro)' })
      expect(milk.map((i) => i.id)).toContain(makro.id)
      expect(milk.map((i) => i.id)).not.toContain(cp.id)
    })

    it('treats % and _ as plain characters', async () => {
      const tag = randomUUID()
      const percent = await make({ name: `ส่วนลด 10% ${tag}`, unitCost: '1', unit: 'ครั้ง' })
      await make({ name: `ส่วนลด 10x ${tag}`, unitCost: '1', unit: 'ครั้ง' })

      const found = await listCostItems(db, { search: `10% ${tag}` })
      expect(found.map((i) => i.id)).toEqual([percent.id])
      expect(await listCostItems(db, { search: `10_ ${tag}` })).toEqual([])
    })
  })

  describe('counting the sheets that use an item', () => {
    async function sheetLinking(...items: CostItem[]) {
      const sheet = await createCostSheet(db, uniqueName('ชีต'))
      madeSheets.push(sheet)
      await saveCostSheet(db, sheet.id, {
        name: sheet.name,
        saleUnit: 'แก้ว',
        sellingPrice: '65',
        gpPercent: '0',
        vatPercent: '7',
        lines: items.map((item) => ({ costItemId: item.id, quantityUsed: '1' })),
      })
    }

    it('counts each sheet with a Linked Line to the item once', async () => {
      const matcha = await make({ name: uniqueName('มัทฉะ'), unitCost: '4', unit: 'g' })
      const milk = await make({ name: uniqueName('นมสด'), unitCost: '0.075', unit: 'ml' })
      await sheetLinking(matcha, matcha)
      await sheetLinking(matcha, milk)
      await sheetLinking(milk)

      expect(await countSheetsUsingCostItem(db, matcha.id)).toBe(2)
      expect(await countSheetsUsingCostItem(db, milk.id)).toBe(2)
    })

    it('counts no sheets for an unused, unknown or malformed item', async () => {
      const unused = await make({ name: uniqueName('น้ำแข็ง'), unitCost: '1', unit: 'g' })
      expect(await countSheetsUsingCostItem(db, unused.id)).toBe(0)
      expect(await countSheetsUsingCostItem(db, randomUUID())).toBe(0)
      expect(await countSheetsUsingCostItem(db, 'not-an-id')).toBe(0)
    })
  })

  describe('deleting an item that sheets use', () => {
    // A sheet's figures as the seller sees them: loaded, then computed.
    async function totals(sheetId: string) {
      const sheet = (await getCostSheet(db, sheetId))!
      const result = computeSheet({
        sellingPrice: Number(sheet.sellingPrice),
        gpPercent: Number(sheet.gpPercent),
        vatPercent: Number(sheet.vatPercent),
        lines: sheet.lines.map((line) => ({
          id: line.id,
          categoryId: line.categoryId,
          name: line.name,
          unit: line.unit,
          unitCost: Number(line.unitCost),
          quantityUsed: Number(line.quantityUsed),
        })),
      })
      return {
        totalCost: result.totalCost,
        netProfit: result.netProfit,
        categories: result.categories,
      }
    }

    async function sheetWith(lines: CostSheetInput['lines']) {
      const sheet = await createCostSheet(db, uniqueName('ชีต'))
      madeSheets.push(sheet)
      await saveCostSheet(db, sheet.id, {
        name: sheet.name,
        saleUnit: 'แก้ว',
        sellingPrice: '65',
        gpPercent: '33',
        vatPercent: '7',
        lines,
      })
      return sheet
    }

    it("turns its Linked Lines into Manual Lines, and no sheet's figures change", async () => {
      const ingredients = await makeCategory('วัตถุดิบ')
      const matcha = await make({
        name: uniqueName('มัทฉะ'),
        unitCost: '4.25',
        unit: 'g',
        categoryId: ingredients.id,
      })
      const milk = await make({ name: uniqueName('นมสด'), unitCost: '0.075', unit: 'ml' })
      const latte = await sheetWith([
        { costItemId: matcha.id, quantityUsed: '4' },
        { costItemId: milk.id, quantityUsed: '150' },
        { name: 'แก้ว', unitCost: '3', unit: 'ชิ้น', quantityUsed: '1', categoryId: null },
        { costItemId: matcha.id, quantityUsed: '0.5' },
      ])
      const shot = await sheetWith([{ costItemId: matcha.id, quantityUsed: '2' }])
      const latteBefore = await totals(latte.id)
      const shotBefore = await totals(shot.id)

      await deleteCostItem(db, matcha.id)

      expect(await getCostItem(db, matcha.id)).toBeNull()
      expect(await totals(latte.id)).toEqual(latteBefore)
      expect(await totals(shot.id)).toEqual(shotBefore)

      const manualMatcha = {
        kind: 'manual',
        name: matcha.name,
        unitCost: '4.25',
        unit: 'g',
        categoryId: ingredients.id,
      }
      expect((await getCostSheet(db, latte.id))!.lines).toMatchObject([
        { ...manualMatcha, quantityUsed: '4' },
        { kind: 'linked', costItemId: milk.id },
        { kind: 'manual', name: 'แก้ว' },
        { ...manualMatcha, quantityUsed: '0.5' },
      ])
      expect((await getCostSheet(db, shot.id))!.lines).toMatchObject([
        { ...manualMatcha, quantityUsed: '2' },
      ])
      expect(await countSheetsUsingCostItem(db, matcha.id)).toBe(0)
    })

    it("holds the item's last values, not the ones it had when linked", async () => {
      const input = { name: uniqueName('ไซรัป'), unitCost: '0.4', unit: 'ml' }
      const syrup = await make(input)
      const sheet = await sheetWith([{ costItemId: syrup.id, quantityUsed: '10' }])
      const changed = await updateCostItem(db, syrup.id, {
        ...input,
        name: uniqueName('ไซรัปใหม่'),
        unitCost: '0.45',
      })

      await deleteCostItem(db, syrup.id)

      expect((await getCostSheet(db, sheet.id))!.lines).toMatchObject([
        { kind: 'manual', name: changed.name, unitCost: '0.45', unit: 'ml', quantityUsed: '10' },
      ])
    })

    it('does nothing for an unknown or malformed id', async () => {
      await expect(deleteCostItem(db, randomUUID())).resolves.toBeUndefined()
      await expect(deleteCostItem(db, 'not-an-id')).resolves.toBeUndefined()
    })
  })
})

describe('saving a Manual Line into the Cost List', () => {
  // Like make(), but through the save, so whatever it creates is cleaned up too.
  async function save(line: ManualLineInput) {
    const saved = await saveManualLineToCostList(db, line)
    if (saved.outcome === 'created') made.push(saved.item)
    return saved
  }

  it('creates a Cost Item from the line at once, and the line can then link to it', async () => {
    const ingredients = await makeCategory('วัตถุดิบ')
    const line: ManualLineInput = {
      name: `  ${uniqueName('ไซรัป')}  `,
      unitCost: '0.35',
      unit: 'ml',
      quantityUsed: '20',
      categoryId: ingredients.id,
    }
    const saved = await save(line)

    expect(saved.outcome).toBe('created')
    expect(saved.item).toEqual({
      id: expect.any(String),
      name: line.name.trim(),
      unitCost: '0.35',
      unit: 'ml',
      categoryId: ingredients.id,
    })
    expect(await getCostItem(db, saved.item.id)).toEqual(saved.item)

    // The line's switch to a Linked Line is a sheet edit, kept when the sheet is saved.
    const sheet = await createCostSheet(db, uniqueName('ชีต'))
    madeSheets.push(sheet)
    const linked = linkLine(line, saved.item)
    await saveCostSheet(db, sheet.id, {
      name: sheet.name,
      saleUnit: 'แก้ว',
      sellingPrice: '65',
      gpPercent: '0',
      vatPercent: '7',
      lines: [linked],
    })
    const [reloaded] = (await getCostSheet(db, sheet.id))!.lines
    expect(reloaded).toEqual({
      id: expect.any(String),
      kind: 'linked',
      costItemId: saved.item.id,
      name: saved.item.name,
      unitCost: '0.35',
      unit: 'ml',
      quantityUsed: '20',
      categoryId: ingredients.id,
    })
  })

  it('creates nothing on a name clash, and returns the existing item to link to', async () => {
    const name = uniqueName('Oat Milk')
    const existing = await make({ name, unitCost: '0.09', unit: 'ml' })
    const before = await listCostItems(db, { search: name })

    const saved = await save({
      name: `  ${name.toUpperCase()} `,
      unitCost: '0.12',
      unit: 'ml',
      quantityUsed: '150',
      categoryId: null,
    })

    expect(saved).toEqual({ outcome: 'clash', item: existing })
    expect(await listCostItems(db, { search: name })).toEqual(before)
  })

  it('treats wildcard characters in the name literally when checking for a clash', async () => {
    const tag = randomUUID()
    await make({ name: `ab ${tag}`, unitCost: '1', unit: 'g' })
    const saved = await save({
      name: `a_ ${tag}`,
      unitCost: '1',
      unit: 'g',
      quantityUsed: '1',
      categoryId: null,
    })
    expect(saved.outcome).toBe('created')
  })

  it("rejects a line whose values can't make a Cost Item", async () => {
    await expect(
      save({ name: uniqueName('ฝา'), unitCost: '', unit: 'ชิ้น', quantityUsed: '1', categoryId: null }),
    ).rejects.toThrow(CostListError)
  })
})
