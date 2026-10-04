import { createServerClient } from '@/server/supabase'

// Cost Sheets (CONTEXT.md): one saved costing per thing the seller sells. Money, percentages
// and quantities travel as decimal strings, never JS numbers, so what the seller typed is
// stored and read back exactly. The Selling Price is never rounded.

/** A Cost Line whose values are typed on the sheet itself. */
export type ManualLine = {
  id: string
  kind: 'manual'
  name: string
  unitCost: string
  unit: string
  quantityUsed: string
  // Its Cost Category, or null for ไม่มีหมวด.
  categoryId: string | null
}

/**
 * A Cost Line picked from the Cost List. Its name, Unit Cost, Unit and Cost Category are the
 * Cost Item's current values, read when the sheet is loaded; only its Quantity Used is the
 * sheet's own.
 */
export type LinkedLine = {
  id: string
  kind: 'linked'
  costItemId: string
  name: string
  unitCost: string
  unit: string
  quantityUsed: string
  categoryId: string | null
}

export type CostLine = ManualLine | LinkedLine

export type CostSheet = {
  id: string
  name: string
  saleUnit: string
  sellingPrice: string
  gpPercent: string
  vatPercent: string
  lines: CostLine[]
}

export type CostSheetSummary = {
  id: string
  name: string
  saleUnit: string
  updatedAt: string
}

export type ManualLineInput = Omit<ManualLine, 'id' | 'kind'>

/** A Linked Line as saved: which Cost Item, and how much of it. The rest comes from the item. */
export type LinkedLineInput = Pick<LinkedLine, 'costItemId' | 'quantityUsed'>

export type CostLineInput = ManualLineInput | LinkedLineInput

/** Everything a save writes: the sheet's own fields and its lines, in order. */
export type CostSheetInput = Omit<CostSheet, 'id' | 'lines'> & { lines: CostLineInput[] }

// A rule of Cost Sheets was broken. The message is Thai and is shown to the seller as is.
export class CostSheetError extends Error {
  name = 'CostSheetError'
}

const NOT_FOUND = 'ไม่พบชีตนี้ อาจถูกลบไปแล้ว'
const CATEGORY_NOT_FOUND = 'ไม่พบหมวดนี้ อาจถูกลบไปแล้ว'
const COST_ITEM_NOT_FOUND = 'ไม่พบรายการต้นทุนนี้ในลิสต์ อาจถูกลบไปแล้ว'
const DEFAULT_SALE_UNIT = 'ชิ้น'
const INVALID_TEXT_REPRESENTATION = '22P02' // an id that is not a uuid
const FOREIGN_KEY_VIOLATION = '23503'
const NO_DATA_FOUND = 'P0002' // raised by save_cost_sheet for a missing sheet

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Plain decimals only: "4", "0.075", ".5", "-2". Not "1e3", "0x10" or "4 บาท".
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)$/

// A non-negative decimal, trimmed, or a CostSheetError naming the field.
function decimal(value: string, label: string) {
  const text = value.trim()
  if (!DECIMAL.test(text)) throw new CostSheetError(`${label}ต้องเป็นตัวเลข`)
  if (text.startsWith('-') && Number(text) !== 0) throw new CostSheetError(`${label}ติดลบไม่ได้`)
  return text
}

function required(value: string, message: string) {
  const text = value.trim()
  if (text === '') throw new CostSheetError(message)
  return text
}

const sheetName = (name: string) => required(name, 'ต้องใส่ชื่อชีต')

// Read numeric as text so PostgREST never turns it into a float.
// One literal, not concatenated, so supabase-js can type the result from it.
const columns =
  'id, name, sale_unit, selling_price::text, gp_percent::text, vat_percent::text, cost_line(id, position, quantity_used::text, cost_item_id, name, unit_cost::text, unit, cost_category_id, cost_item(name, unit_cost::text, unit, cost_category_id))'

async function readSheet(id: string): Promise<CostSheet | null> {
  const { data, error } = await createServerClient()
    .from('cost_sheet')
    .select(columns)
    .eq('id', id)
    .order('position', { referencedTable: 'cost_line' })
    .maybeSingle()
  if (error?.code === INVALID_TEXT_REPRESENTATION) return null
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    saleUnit: data.sale_unit,
    sellingPrice: data.selling_price,
    gpPercent: data.gp_percent,
    vatPercent: data.vat_percent,
    lines: data.cost_line.map((line): CostLine => {
      // A Linked Line resolves to its Cost Item's current values. The foreign key guarantees
      // the item is there.
      if (line.cost_item_id !== null) {
        const item = line.cost_item!
        return {
          id: line.id,
          kind: 'linked',
          costItemId: line.cost_item_id,
          name: item.name,
          unitCost: item.unit_cost,
          unit: item.unit,
          quantityUsed: line.quantity_used,
          categoryId: item.cost_category_id,
        }
      }
      // The cost_line_linked_or_manual check guarantees a Manual Line's values are present.
      return {
        id: line.id,
        kind: 'manual',
        name: line.name!,
        unitCost: line.unit_cost!,
        unit: line.unit!,
        quantityUsed: line.quantity_used,
        categoryId: line.cost_category_id,
      }
    }),
  }
}

/** Every Cost Sheet, the most recently changed first. */
export async function listCostSheets(): Promise<CostSheetSummary[]> {
  const { data, error } = await createServerClient()
    .from('cost_sheet')
    .select('id, name, sale_unit, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    saleUnit: row.sale_unit,
    updatedAt: row.updated_at,
  }))
}

/** One Cost Sheet with its lines in order, or null when there is no such sheet. */
export async function getCostSheet(id: string): Promise<CostSheet | null> {
  return readSheet(id)
}

/** A new, empty Cost Sheet: Sale Unit ชิ้น, Selling Price 0, GP 0%, VAT 7%. */
export async function createCostSheet(name: string): Promise<CostSheet> {
  const { data, error } = await createServerClient()
    .from('cost_sheet')
    .insert({ name: sheetName(name), sale_unit: DEFAULT_SALE_UNIT })
    .select('id')
    .single()
  if (error) throw error
  const sheet = await readSheet(data.id)
  if (!sheet) throw new CostSheetError(NOT_FOUND)
  return sheet
}

/**
 * Saves a Cost Sheet as one unit: its own fields, and its lines replacing the old ones as a
 * whole. Either all of it is saved or, when anything is invalid, none of it.
 */
export async function saveCostSheet(id: string, input: CostSheetInput): Promise<CostSheet> {
  const sheet = {
    name: sheetName(input.name),
    sale_unit: required(input.saleUnit, 'ต้องใส่หน่วยขาย'),
    selling_price: decimal(input.sellingPrice, 'ราคาขาย'),
    gp_percent: decimal(input.gpPercent, 'GP '),
    vat_percent: decimal(input.vatPercent, 'VAT '),
  }
  const lines = input.lines.map((line) => {
    if ('costItemId' in line) {
      if (!UUID.test(line.costItemId)) throw new CostSheetError(COST_ITEM_NOT_FOUND)
      return {
        cost_item_id: line.costItemId,
        quantity_used: decimal(line.quantityUsed, 'ปริมาณที่ใช้'),
      }
    }
    if (line.categoryId !== null && !UUID.test(line.categoryId)) {
      throw new CostSheetError(CATEGORY_NOT_FOUND)
    }
    return {
      name: required(line.name, 'ต้องใส่ชื่อรายการ'),
      unit_cost: decimal(line.unitCost, 'ต้นทุนต่อหน่วย'),
      unit: required(line.unit, 'ต้องใส่หน่วย'),
      quantity_used: decimal(line.quantityUsed, 'ปริมาณที่ใช้'),
      cost_category_id: line.categoryId,
    }
  })
  if (!UUID.test(id)) throw new CostSheetError(NOT_FOUND)

  const { error } = await createServerClient().rpc('save_cost_sheet', {
    p_sheet_id: id,
    p_sheet: sheet,
    p_lines: lines,
  })
  if (error?.code === NO_DATA_FOUND) throw new CostSheetError(NOT_FOUND)
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    // Which reference was missing: the Cost Item of a Linked Line, or a Cost Category.
    const missingItem = error.message.includes('cost_line_cost_item_id_fkey')
    throw new CostSheetError(missingItem ? COST_ITEM_NOT_FOUND : CATEGORY_NOT_FOUND)
  }
  if (error) throw error

  const saved = await readSheet(id)
  if (!saved) throw new CostSheetError(NOT_FOUND)
  return saved
}

/** Deletes a Cost Sheet and its lines. */
export async function deleteCostSheet(id: string): Promise<void> {
  const { error } = await createServerClient().from('cost_sheet').delete().eq('id', id)
  if (error && error.code !== INVALID_TEXT_REPRESENTATION) throw error
}
