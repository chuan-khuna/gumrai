import { createServerClient } from '@/server/supabase'

// Cost Categories (GLOSSARY.md): groups the seller names themselves. Each has a colour slot,
// an index into the fixed palette (@/lib/category-colours), assigned automatically: the
// seller never picks a colour.
export type CostCategory = {
  id: string
  name: string
  colourSlot: number
}

// A rule of Cost Categories was broken. The message is Thai and is shown to the seller as is.
export class CostCategoryError extends Error {
  name = 'CostCategoryError'
}

const NOT_FOUND = 'ไม่พบหมวดนี้ อาจถูกลบไปแล้ว'
const INVALID_TEXT_REPRESENTATION = '22P02' // an id that is not a uuid

const columns = 'id, name, colour_slot'

type Row = { id: string; name: string; colour_slot: number }

function toCostCategory(row: Row): CostCategory {
  return { id: row.id, name: row.name, colourSlot: row.colour_slot }
}

function toName(name: string) {
  const trimmed = name.trim()
  if (trimmed === '') throw new CostCategoryError('ต้องใส่ชื่อหมวด')
  return trimmed
}

// The lowest slot no category holds, so categories keep distinct colours while the palette
// lasts, and a deleted category's colour is reused first.
function freeSlot(taken: number[]) {
  const used = new Set(taken)
  let slot = 0
  while (used.has(slot)) slot++
  return slot
}

// The seller's Cost Categories, in their listed order.
export async function listCostCategories(): Promise<CostCategory[]> {
  const { data, error } = await createServerClient()
    .from('cost_category')
    .select(columns)
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return data.map(toCostCategory)
}

// Adds a Cost Category at the end of the list, with a colour of its own.
export async function createCostCategory(name: string): Promise<CostCategory> {
  const row = { name: toName(name) }
  const supabase = createServerClient()
  const { data: existing, error: readError } = await supabase
    .from('cost_category')
    .select('colour_slot, sort_order')
  if (readError) throw readError
  const { data, error } = await supabase
    .from('cost_category')
    .insert({
      ...row,
      colour_slot: freeSlot(existing.map((c) => c.colour_slot)),
      sort_order: Math.max(-1, ...existing.map((c) => c.sort_order)) + 1,
    })
    .select(columns)
    .single()
  if (error) throw error
  return toCostCategory(data)
}

// Renames a Cost Category. Its items stay in it, and it keeps its colour and place.
export async function renameCostCategory(id: string, name: string): Promise<CostCategory> {
  const { data, error } = await createServerClient()
    .from('cost_category')
    .update({ name: toName(name) })
    .eq('id', id)
    .select(columns)
    .maybeSingle()
  if (error && error.code !== INVALID_TEXT_REPRESENTATION) throw error
  if (!data) throw new CostCategoryError(NOT_FOUND)
  return toCostCategory(data)
}

// How many Cost Items are in a Cost Category: what deleting it would move to ไม่มีหมวด.
export async function countCostItemsIn(id: string): Promise<number> {
  const { count, error } = await createServerClient()
    .from('cost_item')
    .select('id', { count: 'exact', head: true })
    .eq('cost_category_id', id)
  if (error?.code === INVALID_TEXT_REPRESENTATION) return 0
  if (error) throw error
  return count ?? 0
}

// Deletes a Cost Category. Its Cost Items are kept and move to ไม่มีหมวด: the database does
// this in the same statement (cost_item_cost_category_id_fkey is ON DELETE SET NULL).
export async function deleteCostCategory(id: string): Promise<void> {
  const { error } = await createServerClient().from('cost_category').delete().eq('id', id)
  if (error) throw error
}
