import { notFound } from 'next/navigation'
import { SheetEditor } from '@/app/sheets/[id]/sheet-editor'
import { listCostItems } from '@/server/cost-items'
import { getCostSheet } from '@/server/cost-sheets'

// Read on every request, so a reopened sheet shows what was last saved.
export const dynamic = 'force-dynamic'

export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [sheet, costItems] = await Promise.all([getCostSheet(id), listCostItems()])
  if (!sheet) notFound()

  // Keyed by id so opening another sheet starts a fresh editor.
  return <SheetEditor key={sheet.id} saved={sheet} costItems={costItems} />
}
