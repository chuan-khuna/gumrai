import { notFound } from 'next/navigation'
import { SheetEditor } from '@/app/sheets/[id]/sheet-editor'
import { listCostCategories } from '@/server/costs/cost-categories'
import { listCostItems } from '@/server/costs/cost-items'
import { getCostSheet } from '@/server/costs/cost-sheets'
import { requestClient } from '@/server/db/request-client'

// Read on every request, so a reopened sheet shows what was last saved.
export const dynamic = 'force-dynamic'

export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  const db = await requestClient()
  const { id } = await params
  const [sheet, costItems, categories] = await Promise.all([
    getCostSheet(db, id),
    listCostItems(db),
    listCostCategories(db),
  ])
  if (!sheet) notFound()

  // Keyed by id so opening another sheet starts a fresh editor.
  return <SheetEditor key={sheet.id} saved={sheet} costItems={costItems} categories={categories} />
}
