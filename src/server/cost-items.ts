import type { Db } from '@/server/supabase'

// Cost Items (GLOSSARY.md): the Cost List's entries. Unit Cost travels as a decimal string,
// never a JS number, so a value like 0.075 is stored and shown exactly as typed.
export type CostItem = {
  id: string
  name: string
  unitCost: string
  unit: string
  // Its Cost Category, or null for ไม่มีหมวด.
  categoryId: string | null
}

export type CostItemInput = {
  name: string
  unitCost: string
  unit: string
  // null puts the item in ไม่มีหมวด. Left out, a new item has none and an update keeps
  // the item's current Cost Category.
  categoryId?: string | null
}

// A rule of the Cost List was broken. The message is Thai and is shown to the seller as is.
export class CostListError extends Error {
  name = 'CostListError'
}

const DUPLICATE_NAME = 'มีรายการชื่อนี้อยู่แล้ว ตั้งชื่อให้ต่างกัน เช่น "นมสด (Makro)"'
const CATEGORY_NOT_FOUND = 'ไม่พบหมวดนี้ อาจถูกลบไปแล้ว'
const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'
const INVALID_TEXT_REPRESENTATION = '22P02'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The database enforces unique names (cost_item_owner_name_key) and that a Cost Category
// exists (cost_item_cost_category_id_fkey); this turns its refusal into the seller-facing
// message.
function rejectBrokenRule(error: { code?: string }): never {
  if (error.code === UNIQUE_VIOLATION) throw new CostListError(DUPLICATE_NAME)
  if (error.code === FOREIGN_KEY_VIOLATION) throw new CostListError(CATEGORY_NOT_FOUND)
  throw error
}

// Read numeric as text so PostgREST never turns it into a float.
const columns = 'id, name, unit_cost::text, unit, cost_category_id'

type Row = {
  id: string
  name: string
  unit_cost: string
  unit: string
  cost_category_id: string | null
}

function toCostItem(row: Row): CostItem {
  return {
    id: row.id,
    name: row.name,
    unitCost: row.unit_cost,
    unit: row.unit,
    categoryId: row.cost_category_id,
  }
}

// Plain decimals only: "4", "0.075", ".5", "-2". Not "1e3", "0x10" or "4 บาท".
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)$/

// Validates and normalises what the seller typed into the row that is stored.
function toRow(input: CostItemInput) {
  const name = input.name.trim()
  const unit = input.unit.trim()
  const unitCost = input.unitCost.trim()
  if (name === '') throw new CostListError('ต้องใส่ชื่อ')
  if (!DECIMAL.test(unitCost)) throw new CostListError('ต้นทุนต่อหน่วยต้องเป็นตัวเลข')
  if (unitCost.startsWith('-') && Number(unitCost) !== 0) {
    throw new CostListError('ต้นทุนต่อหน่วยติดลบไม่ได้')
  }
  if (unit === '') throw new CostListError('ต้องใส่หน่วย')
  const { categoryId } = input
  if (typeof categoryId === 'string' && !UUID.test(categoryId)) {
    throw new CostListError(CATEGORY_NOT_FOUND)
  }
  return {
    name,
    // PostgREST casts the decimal string straight to numeric; the generated type says number.
    unit_cost: unitCost as unknown as number,
    unit,
    ...(categoryId !== undefined && { cost_category_id: categoryId }),
  }
}

// ILIKE treats % and _ as wildcards and \ as their escape; a search means them literally.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`)
}

// The Cost List, by name. `search` keeps only names containing it, ignoring case and
// surrounding spaces. `categoryId` keeps only one Cost Category's items, or with null only
// the items in ไม่มีหมวด.
export async function listCostItems(
  db: Db,
  options: { search?: string; categoryId?: string | null } = {},
): Promise<CostItem[]> {
  let query = db.from('cost_item').select(columns)
  const search = options.search?.trim()
  if (search) query = query.ilike('name', `%${escapeLike(search)}%`)
  const { categoryId } = options
  if (categoryId === null) query = query.is('cost_category_id', null)
  else if (categoryId !== undefined) {
    if (!UUID.test(categoryId)) return [] // no such category, so nothing is in it
    query = query.eq('cost_category_id', categoryId)
  }
  const { data, error } = await query.order('name')
  if (error) throw error
  return data.map(toCostItem)
}

export async function getCostItem(db: Db, id: string): Promise<CostItem | null> {
  const { data, error } = await db
    .from('cost_item')
    .select(columns)
    .eq('id', id)
    .maybeSingle()
  if (error?.code === INVALID_TEXT_REPRESENTATION) return null // not a uuid, so no such item
  if (error) throw error
  return data && toCostItem(data)
}

export async function createCostItem(db: Db, input: CostItemInput): Promise<CostItem> {
  const { data, error } = await db
    .from('cost_item')
    .insert(toRow(input))
    .select(columns)
    .single()
  if (error) rejectBrokenRule(error)
  return toCostItem(data)
}

export async function updateCostItem(db: Db, id: string, input: CostItemInput): Promise<CostItem> {
  const { data, error } = await db
    .from('cost_item')
    .update(toRow(input))
    .eq('id', id)
    .select(columns)
    .maybeSingle()
  if (error) rejectBrokenRule(error)
  if (!data) throw new CostListError('ไม่พบรายการนี้ อาจถูกลบไปแล้ว')
  return toCostItem(data)
}

/**
 * What saving a Manual Line into the Cost List did: `created` made a new Cost Item from the
 * line; `clash` made nothing, because the item already holds that name, and is offered for the
 * line to link to instead.
 */
export type SavedManualLine = { outcome: 'created'; item: CostItem } | { outcome: 'clash'; item: CostItem }

// The Cost Item whose name matches, ignoring case and surrounding spaces, as the unique index
// cost_item_owner_name_key does.
async function findByName(db: Db, name: string): Promise<CostItem | null> {
  const { data, error } = await db
    .from('cost_item')
    .select(columns)
    .ilike('name', escapeLike(name.trim()))
    .maybeSingle()
  if (error) throw error
  return data && toCostItem(data)
}

/**
 * Saves a Manual Line's name, Unit Cost, Unit and Cost Category into the Cost List as a new
 * Cost Item, at once and whether or not its sheet is saved. Turning the line into a Linked
 * Line is the sheet's edit (see linkLine in @/lib/cost-lines). On a name clash nothing is
 * created and the existing item is returned.
 */
export async function saveManualLineToCostList(db: Db, line: CostItemInput): Promise<SavedManualLine> {
  const row = toRow({
    name: line.name,
    unitCost: line.unitCost,
    unit: line.unit,
    categoryId: line.categoryId ?? null,
  })
  const { data, error } = await db
    .from('cost_item')
    .insert(row)
    .select(columns)
    .single()
  if (error?.code === UNIQUE_VIOLATION) {
    const existing = await findByName(db, row.name)
    if (existing) return { outcome: 'clash', item: existing }
  }
  if (error) rejectBrokenRule(error)
  return { outcome: 'created', item: toCostItem(data) }
}

/** How many Cost Sheets have a Linked Line to this Cost Item ("ใช้อยู่ใน N ชีต"). */
export async function countSheetsUsingCostItem(db: Db, id: string): Promise<number> {
  if (!UUID.test(id)) return 0 // no such item, so no sheet uses it
  const { data, error } = await db
    .from('cost_line')
    .select('sheet_id')
    .eq('cost_item_id', id)
  if (error) throw error
  // A sheet may link to the same item on more than one line; it is still one sheet.
  return new Set(data.map((line) => line.sheet_id)).size
}

/**
 * Deletes a Cost Item. Every Linked Line to it first becomes a Manual Line holding the item's
 * last values, so no sheet's figures change (ADR 0002). Both happen in one transaction.
 * An unknown or malformed id deletes nothing.
 */
export async function deleteCostItem(db: Db, id: string): Promise<void> {
  if (!UUID.test(id)) return
  const { error } = await db.rpc('delete_cost_item', { p_id: id })
  if (error) throw error
}
