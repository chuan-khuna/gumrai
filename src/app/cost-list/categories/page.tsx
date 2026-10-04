import Link from 'next/link'
import {
  createCostCategoryAction,
  deleteCostCategoryAction,
  renameCostCategoryAction,
} from '@/app/cost-list/categories/actions'
import { CategoryNameForm, DeleteCategoryButton } from '@/app/cost-list/categories/category-forms'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { UNCATEGORISED } from '@/lib/category-colours'
import { countCostItemsIn, listCostCategories } from '@/server/cost-categories'

// Read on every request, so the page always reflects the database.
export const dynamic = 'force-dynamic'

export default async function CostCategoriesPage() {
  const categories = await listCostCategories()
  const counts = await Promise.all(categories.map((c) => countCostItemsIn(c.id)))

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/cost-list" className="text-sm text-muted">
        ← ลิสต์ต้นทุน
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">หมวดต้นทุน</h1>
      <p className="mt-2 text-muted">สีของแต่ละหมวดถูกกำหนดให้อัตโนมัติ</p>

      <section className="mt-8 rounded border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">เพิ่มหมวด</h2>
        <CategoryNameForm
          action={createCostCategoryAction}
          initialName=""
          submitLabel="เพิ่ม"
          label="ชื่อหมวด"
        />
      </section>

      <ul className="mt-6 divide-y divide-line rounded border border-line bg-card">
        {categories.map((category, i) => (
          <li key={category.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <CategoryDot colourSlot={category.colourSlot} />
            <CategoryNameForm
              action={renameCostCategoryAction.bind(null, category.id)}
              initialName={category.name}
              submitLabel="เปลี่ยนชื่อ"
              label={`ชื่อหมวด ${category.name}`}
            />
            <span className="whitespace-nowrap text-sm text-muted">{counts[i]} รายการ</span>
            <DeleteCategoryButton
              action={deleteCostCategoryAction.bind(null, category.id)}
              name={category.name}
              itemCount={counts[i]}
            />
          </li>
        ))}
        <li className="flex items-center gap-3 px-4 py-3 text-muted">
          <CategoryDot colourSlot={null} />
          {UNCATEGORISED}
        </li>
      </ul>
    </main>
  )
}
