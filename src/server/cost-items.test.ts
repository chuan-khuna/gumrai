import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createCostItem,
  deleteCostItem,
  getCostItem,
  listCostItems,
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

// Each test makes names no other test (or the dev seed) uses, and deletes what it made.
const made: CostItem[] = []
function uniqueName(label: string) {
  return `${label} ${randomUUID()}`
}
async function make(input: CostItemInput) {
  const item = await createCostItem(input)
  made.push(item)
  return item
}
const madeCategories: CostCategory[] = []
async function makeCategory(label: string) {
  const category = await createCostCategory(uniqueName(label))
  madeCategories.push(category)
  return category
}

afterEach(async () => {
  for (const item of made.splice(0)) {
    await deleteCostItem(item.id).catch(() => {})
  }
  for (const category of madeCategories.splice(0)) {
    await deleteCostCategory(category.id).catch(() => {})
  }
})

describe('Cost Items', () => {
  it('creates a Cost Item that then appears in the list', async () => {
    const name = uniqueName('มัทฉะ')
    const item = await make({ name, unitCost: '4', unit: 'g' })

    expect(item).toMatchObject({ name, unitCost: '4', unit: 'g' })
    expect(await listCostItems()).toContainEqual(item)
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

        const attempt = updateCostItem(other.id, { name: rename(taken), unitCost: '3', unit: 'ชิ้น' })
        await expect(attempt).rejects.toThrow(CostListError)
        await expect(attempt).rejects.toThrow('มีรายการชื่อนี้อยู่แล้ว')
        expect((await listCostItems()).find((i) => i.id === other.id)).toEqual(other)
      })
    }
  })

  it('updates a Cost Item, and the list shows the saved values', async () => {
    const item = await make({ name: uniqueName('มัทฉะ'), unitCost: '4', unit: 'g' })
    const name = uniqueName('มัทฉะ เกรดพิธี')

    const updated = await updateCostItem(item.id, { name, unitCost: '4.25', unit: 'กรัม' })

    expect(updated).toEqual({ id: item.id, name, unitCost: '4.25', unit: 'กรัม', categoryId: null })
    expect((await listCostItems()).find((i) => i.id === item.id)).toEqual(updated)
  })

  it('lets a Cost Item keep its own name in a different case', async () => {
    const name = uniqueName('matcha')
    const item = await make({ name, unitCost: '4', unit: 'g' })

    const updated = await updateCostItem(item.id, { name: name.toUpperCase(), unitCost: '4', unit: 'g' })

    expect(updated.name).toBe(name.toUpperCase())
  })

  it('validates the Unit Cost on update too', async () => {
    const item = await make({ name: uniqueName('x'), unitCost: '1', unit: 'g' })
    await expect(updateCostItem(item.id, { ...item, unitCost: '-1' })).rejects.toThrow(
      'ต้นทุนต่อหน่วยติดลบไม่ได้',
    )
  })

  it('gets one Cost Item by id, for its edit form', async () => {
    const item = await make({ name: uniqueName('ไซรัป'), unitCost: '0.4', unit: 'ml' })
    expect(await getCostItem(item.id)).toEqual(item)
    expect(await getCostItem('not-an-id')).toBeNull()
  })

  it('deletes a Cost Item, and it leaves the list', async () => {
    const item = await make({ name: uniqueName('ซอง'), unitCost: '1', unit: 'ซอง' })

    await deleteCostItem(item.id)

    expect((await listCostItems()).map((i) => i.id)).not.toContain(item.id)
    expect(await getCostItem(item.id)).toBeNull()
  })

  it('frees a deleted name for a new Cost Item', async () => {
    const name = uniqueName('หลอด')
    const item = await make({ name, unitCost: '0.5', unit: 'ชิ้น' })
    await deleteCostItem(item.id)

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

      const moved = await updateCostItem(item.id, { ...input, categoryId: packaging.id })
      expect(moved.categoryId).toBe(packaging.id)
      expect(await getCostItem(item.id)).toEqual(moved)

      const cleared = await updateCostItem(item.id, { ...input, categoryId: null })
      expect(cleared.categoryId).toBeNull()
    })

    it('rejects a Cost Category that does not exist, with a Thai message', async () => {
      const gone = await makeCategory('ลบแล้ว')
      await deleteCostCategory(gone.id)
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

      const inSyrups = await listCostItems({ categoryId: syrups.id })
      expect(inSyrups).toEqual([vanilla])

      const uncategorised = await listCostItems({ search: tag, categoryId: null })
      expect(uncategorised).toEqual([ice])
    })
  })

  describe('searching by name', () => {
    it('lists only names containing the search, ignoring case and surrounding spaces', async () => {
      const tag = randomUUID()
      const makro = await make({ name: `นมสด (Makro) ${tag}`, unitCost: '0.06', unit: 'ml' })
      const cp = await make({ name: `นมสด (CP) ${tag}`, unitCost: '0.07', unit: 'ml' })
      const cup = await make({ name: `แก้ว ${tag}`, unitCost: '3', unit: 'ชิ้น' })

      const found = await listCostItems({ search: `  ${tag.toUpperCase()} ` })
      expect(found.map((i) => i.id).sort()).toEqual([makro.id, cp.id, cup.id].sort())

      const milk = await listCostItems({ search: 'นมสด (makro)' })
      expect(milk.map((i) => i.id)).toContain(makro.id)
      expect(milk.map((i) => i.id)).not.toContain(cp.id)
    })

    it('treats % and _ as plain characters', async () => {
      const tag = randomUUID()
      const percent = await make({ name: `ส่วนลด 10% ${tag}`, unitCost: '1', unit: 'ครั้ง' })
      await make({ name: `ส่วนลด 10x ${tag}`, unitCost: '1', unit: 'ครั้ง' })

      const found = await listCostItems({ search: `10% ${tag}` })
      expect(found.map((i) => i.id)).toEqual([percent.id])
      expect(await listCostItems({ search: `10_ ${tag}` })).toEqual([])
    })
  })
})
