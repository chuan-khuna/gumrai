import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CostCategoryError,
  createCostCategory,
  deleteCostCategory,
  listCostCategories,
  renameCostCategory,
  countCostItemsIn,
  type CostCategory,
} from '@/server/cost-categories'
import { createCostItem, deleteCostItem, getCostItem, type CostItem } from '@/server/cost-items'
import { createServerClient } from '@/server/supabase'

// The secret-key client the app itself uses until sign-in lands (ticket 02).
const db = createServerClient()

// Each test makes names no other test uses, and deletes what it made.
const made: CostCategory[] = []
const madeItems: CostItem[] = []
function uniqueName(label: string) {
  return `${label} ${randomUUID()}`
}
async function make(name: string) {
  const category = await createCostCategory(db, name)
  made.push(category)
  return category
}

afterEach(async () => {
  for (const item of madeItems.splice(0)) {
    await deleteCostItem(db, item.id).catch(() => {})
  }
  for (const category of made.splice(0)) {
    await deleteCostCategory(db, category.id).catch(() => {})
  }
})

describe('Cost Categories', () => {
  // Holds on a database fresh from `bun run db:reset`: the migration makes these three.
  it('starts with วัตถุดิบ, บรรจุภัณฑ์ and อื่น ๆ, in that order and in different colours', async () => {
    const starting = (await listCostCategories(db)).filter((c) =>
      ['วัตถุดิบ', 'บรรจุภัณฑ์', 'อื่น ๆ'].includes(c.name),
    )

    expect(starting.map((c) => c.name)).toEqual(['วัตถุดิบ', 'บรรจุภัณฑ์', 'อื่น ๆ'])
    expect(new Set(starting.map((c) => c.colourSlot)).size).toBe(3)
  })

  // Other test files run at the same time and may add categories too, so these compare
  // only with the categories that existed before.
  it('creates a Cost Category listed after the ones before it, with its name trimmed', async () => {
    const before = await listCostCategories(db)
    const name = uniqueName('ท็อปปิ้ง')
    const category = await make(`  ${name} `)

    expect(category.name).toBe(name)
    const ids = (await listCostCategories(db)).map((c) => c.id)
    expect(ids).toContain(category.id)
    for (const earlier of before) {
      expect(ids.indexOf(category.id)).toBeGreaterThan(ids.indexOf(earlier.id))
    }
  })

  it('gives a new Cost Category a colour no other category has', async () => {
    const before = (await listCostCategories(db)).map((c) => c.colourSlot)
    const first = await make(uniqueName('ไซรัป'))
    const second = await make(uniqueName('ผลไม้'))

    expect(before).not.toContain(first.colourSlot)
    expect(before).not.toContain(second.colourSlot)
    expect(first.colourSlot).not.toBe(second.colourSlot)
  })

  it('renames a Cost Category, keeping its colour and place', async () => {
    const category = await make(uniqueName('ของแห้ง'))
    const name = uniqueName('วัตถุดิบแห้ง')

    const renamed = await renameCostCategory(db, category.id, ` ${name}  `)

    expect(renamed).toEqual({ ...category, name })
    expect((await listCostCategories(db)).find((c) => c.id === category.id)).toEqual(renamed)
  })

  it('rejects renaming to a blank name, or a category that is gone', async () => {
    const category = await make(uniqueName('ของสด'))
    await expect(renameCostCategory(db, category.id, ' ')).rejects.toThrow('ต้องใส่ชื่อหมวด')

    await deleteCostCategory(db, category.id)
    await expect(renameCostCategory(db, category.id, 'อะไรก็ได้')).rejects.toThrow(
      'ไม่พบหมวดนี้ อาจถูกลบไปแล้ว',
    )
  })

  it('counts the Cost Items in each Cost Category, for the delete confirmation', async () => {
    const empty = await make(uniqueName('ว่าง'))
    const toppings = await make(uniqueName('ท็อปปิ้ง'))
    const input = { unitCost: '2', unit: 'g' }
    const items = [
      await createCostItem(db, { ...input, name: uniqueName('ไข่มุก'), categoryId: toppings.id }),
      await createCostItem(db, { ...input, name: uniqueName('วุ้น'), categoryId: toppings.id }),
    ]
    madeItems.push(...items)

    expect(await countCostItemsIn(db, toppings.id)).toBe(2)
    expect(await countCostItemsIn(db, empty.id)).toBe(0)
  })

  it('deletes a Cost Category, leaving its Cost Items in ไม่มีหมวด', async () => {
    const fruit = await make(uniqueName('ผลไม้'))
    const keep = await make(uniqueName('เก็บไว้'))
    const strawberry = await createCostItem(db, {
      name: uniqueName('สตรอว์เบอร์รี'),
      unitCost: '1.5',
      unit: 'g',
      categoryId: fruit.id,
    })
    const mango = await createCostItem(db, {
      name: uniqueName('มะม่วง'),
      unitCost: '0.8',
      unit: 'g',
      categoryId: keep.id,
    })
    madeItems.push(strawberry, mango)

    await deleteCostCategory(db, fruit.id)

    expect((await listCostCategories(db)).map((c) => c.id)).not.toContain(fruit.id)
    expect(await getCostItem(db, strawberry.id)).toEqual({ ...strawberry, categoryId: null })
    expect(await getCostItem(db, mango.id)).toEqual(mango)
  })

  it('rejects a blank name with a Thai message', async () => {
    await expect(make('   ')).rejects.toThrow(CostCategoryError)
    await expect(make('   ')).rejects.toThrow('ต้องใส่ชื่อหมวด')
  })
})
