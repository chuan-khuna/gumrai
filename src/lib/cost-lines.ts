// Cost Line rules that need no database, so the sheet editor can apply them in the browser.

import type { CostItem } from '@/server/cost-items'
import type { LinkedLine, ManualLineInput } from '@/server/cost-sheets'

/**
 * Unlinks a Linked Line (GLOSSARY.md): the Manual Line it becomes holds the values the line
 * has now, so the sheet's figures do not move, and later Cost Item changes leave it alone.
 */
export function unlinkLine(line: Omit<LinkedLine, 'id' | 'kind'>): ManualLineInput {
  return {
    name: line.name,
    unitCost: line.unitCost,
    unit: line.unit,
    quantityUsed: line.quantityUsed,
    categoryId: line.categoryId,
  }
}

/**
 * Links a Manual Line to a Cost Item, such as the one saving the line into the Cost List made
 * or found. The line keeps its Quantity Used and takes everything else from the item.
 */
export function linkLine(line: Pick<ManualLineInput, 'quantityUsed'>, item: CostItem): Omit<LinkedLine, 'id'> {
  return {
    kind: 'linked',
    costItemId: item.id,
    name: item.name,
    unitCost: item.unitCost,
    unit: item.unit,
    categoryId: item.categoryId,
    quantityUsed: line.quantityUsed,
  }
}
