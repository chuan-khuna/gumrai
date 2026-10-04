import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteCostItemAction, updateCostItemAction } from '@/app/cost-list/actions'
import { CostItemForm } from '@/app/cost-list/cost-item-form'
import { listCostCategories } from '@/server/cost-categories'
import { countSheetsUsingCostItem, getCostItem } from '@/server/cost-items'

export default async function EditCostItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [item, categories, sheetCount] = await Promise.all([
    getCostItem(id),
    listCostCategories(),
    countSheetsUsingCostItem(id),
  ])
  if (!item) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/cost-list" className="text-sm text-muted">
        ← ลิสต์ต้นทุน
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">แก้ไขรายการต้นทุน</h1>
      {/* A changed Unit Cost reaches every one of these sheets (ADR 0002). */}
      <p className="mt-2 text-muted">ใช้อยู่ใน {sheetCount} ชีต</p>

      <section className="mt-8 rounded border border-line bg-card p-4">
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
      </section>

      <form action={deleteCostItemAction.bind(null, item.id)} className="mt-8">
        <button type="submit" className="rounded border border-loss px-4 py-2 text-loss">
          ลบรายการนี้
        </button>
      </form>
    </main>
  )
}
