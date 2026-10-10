import {
  createCostCategoryAction,
  deleteCostCategoryAction,
  renameCostCategoryAction,
} from '@/app/cost-list/categories/actions'
import { CategoryNameForm, DeleteCategoryButton } from '@/app/cost-list/categories/category-forms'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UNCATEGORISED } from '@/lib/category-colours'
import { countCostItemsIn, listCostCategories } from '@/server/costs/cost-categories'
import { requestClient } from '@/server/db/request-client'

// Read on every request, so the page always reflects the database.
export const dynamic = 'force-dynamic'

export default async function CostCategoriesPage() {
  const db = await requestClient()
  const categories = await listCostCategories(db)
  const counts = await Promise.all(categories.map((c) => countCostItemsIn(db, c.id)))

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl">หมวดต้นทุน</h1>
      <p className="mt-2 text-muted-foreground">สีของแต่ละหมวดถูกกำหนดให้อัตโนมัติ</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>เพิ่มหมวด</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryNameForm
            action={createCostCategoryAction}
            initialName=""
            submitLabel="เพิ่ม"
            label="ชื่อหมวด"
            primary
          />
        </CardContent>
      </Card>

      <Card className="mt-6 gap-0 py-2">
        <ul className="divide-y divide-dashed">
          {categories.map((category, i) => (
            <li key={category.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
              <CategoryDot colourSlot={category.colourSlot} />
              <CategoryNameForm
                action={renameCostCategoryAction.bind(null, category.id)}
                initialName={category.name}
                submitLabel="เปลี่ยนชื่อ"
                label={`ชื่อหมวด ${category.name}`}
              />
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {counts[i]} รายการ
              </span>
              <DeleteCategoryButton
                action={deleteCostCategoryAction.bind(null, category.id)}
                name={category.name}
                itemCount={counts[i]}
              />
            </li>
          ))}
          <li className="flex items-center gap-3 px-6 py-3 text-muted-foreground">
            <CategoryDot colourSlot={null} />
            {UNCATEGORISED}
          </li>
        </ul>
      </Card>
    </main>
  )
}
