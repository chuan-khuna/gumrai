import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteCostItemAction, updateCostItemAction } from '@/app/cost-list/actions'
import { CostItemForm, DeleteCostItemButton } from '@/app/cost-list/cost-item-form'
import { Card, CardContent } from '@/components/ui/card'
import { listCostCategories } from '@/server/costs/cost-categories'
import { countSheetsUsingCostItem, getCostItem } from '@/server/costs/cost-items'
import { requestClient } from '@/server/db/request-client'

export default async function EditCostItemPage({ params }: { params: Promise<{ id: string }> }) {
  const db = await requestClient()
  const { id } = await params
  const [item, categories, sheetCount] = await Promise.all([
    getCostItem(db, id),
    listCostCategories(db),
    countSheetsUsingCostItem(db, id),
  ])
  if (!item) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/cost-list" className="text-sm text-muted-foreground hover:text-foreground">
        ← ลิสต์ต้นทุน
      </Link>
      <h1 className="mt-2 text-3xl">แก้ไขรายการต้นทุน</h1>
      {/* A changed Unit Cost reaches every one of these sheets (ADR 0002). */}
      <p className="mt-2 text-muted-foreground">ใช้อยู่ใน {sheetCount} ชีต</p>

      <Card className="mt-8">
        <CardContent>
          <CostItemForm
            action={updateCostItemAction.bind(null, item.id)}
            initial={{
              name: item.name,
              unitCost: item.unitCost,
              unit: item.unit,
              categoryId: item.categoryId,
            }}
            categories={categories}
            submitLabel="บันทึก"
          />
        </CardContent>
      </Card>

      <div className="mt-8">
        <DeleteCostItemButton
          action={deleteCostItemAction.bind(null, item.id)}
          name={item.name}
          sheetCount={sheetCount}
        />
      </div>
    </main>
  )
}
