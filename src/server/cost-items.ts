import { createServerClient } from '@/server/supabase'

// Cost Items (CONTEXT.md): the Cost List's entries. Unit Cost travels as a decimal string,
// never a JS number, so a value like 0.075 is stored and shown exactly as typed.
export type CostItem = {
  id: string
  name: string
  unitCost: string
  unit: string
}

export type CostItemInput = {
  name: string
  unitCost: string
  unit: string
}

// A rule of the Cost List was broken. The message is Thai and is shown to the seller as is.
export class CostListError extends Error {
  name = 'CostListError'
}

const DUPLICATE_NAME = 'มีรายการชื่อนี้อยู่แล้ว ตั้งชื่อให้ต่างกัน เช่น "นมสด (Makro)"'
const UNIQUE_VIOLATION = '23505'
const INVALID_TEXT_REPRESENTATION = '22P02'

// The database enforces unique names (cost_item_owner_name_key); this turns its refusal
// into the seller-facing message.
function rejectDuplicate(error: { code?: string }): never {
  if (error.code === UNIQUE_VIOLATION) throw new CostListError(DUPLICATE_NAME)
  throw error
}

// Read numeric as text so PostgREST never turns it into a float.
const columns = 'id, name, unit_cost::text, unit'

type Row = { id: string; name: string; unit_cost: string; unit: string }

function toCostItem(row: Row): CostItem {
  return { id: row.id, name: row.name, unitCost: row.unit_cost, unit: row.unit }
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
  return {
    name,
    // PostgREST casts the decimal string straight to numeric; the generated type says number.
    unit_cost: unitCost as unknown as number,
    unit,
  }
}

// ILIKE treats % and _ as wildcards and \ as their escape; a search means them literally.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`)
}

// The Cost List, by name. `search` keeps only names containing it, ignoring case and
// surrounding spaces.
export async function listCostItems(options: { search?: string } = {}): Promise<CostItem[]> {
  let query = createServerClient().from('cost_item').select(columns)
  const search = options.search?.trim()
  if (search) query = query.ilike('name', `%${escapeLike(search)}%`)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data.map(toCostItem)
}

export async function getCostItem(id: string): Promise<CostItem | null> {
  const { data, error } = await createServerClient()
    .from('cost_item')
    .select(columns)
    .eq('id', id)
    .maybeSingle()
  if (error?.code === INVALID_TEXT_REPRESENTATION) return null // not a uuid, so no such item
  if (error) throw error
  return data && toCostItem(data)
}

export async function createCostItem(input: CostItemInput): Promise<CostItem> {
  const { data, error } = await createServerClient()
    .from('cost_item')
    .insert(toRow(input))
    .select(columns)
    .single()
  if (error) rejectDuplicate(error)
  return toCostItem(data)
}

export async function updateCostItem(id: string, input: CostItemInput): Promise<CostItem> {
  const { data, error } = await createServerClient()
    .from('cost_item')
    .update(toRow(input))
    .eq('id', id)
    .select(columns)
    .maybeSingle()
  if (error) rejectDuplicate(error)
  if (!data) throw new CostListError('ไม่พบรายการนี้ อาจถูกลบไปแล้ว')
  return toCostItem(data)
}

export async function deleteCostItem(id: string): Promise<void> {
  const { error } = await createServerClient().from('cost_item').delete().eq('id', id)
  if (error) throw error
}
