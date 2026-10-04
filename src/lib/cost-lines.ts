// Cost Line rules that need no database, so the sheet editor can apply them in the browser.

import type { LinkedLine, ManualLineInput } from '@/server/cost-sheets'

/**
 * Unlinks a Linked Line (CONTEXT.md): the Manual Line it becomes holds the values the line
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
