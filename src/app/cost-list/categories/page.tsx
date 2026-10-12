import { AddCategoryForm, CategoryRow } from '@/app/cost-list/categories/category-forms'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { Composer } from '@/components/composer'
import { Card } from '@/components/ui/card'
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
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">หมวดต้นทุน</h1>

      <Composer className="mt-8">
        <AddCategoryForm />
      </Composer>

      <Card className="mt-10 gap-0 py-2">
        <ul className="divide-y divide-dashed divide-border">
          {categories.map((category, i) => (
            <CategoryRow key={category.id} category={category} itemCount={counts[i]} />
          ))}
          {/* ไม่มีหมวด can't be renamed or deleted, so it has no menu; min-h-15 keeps it as
              tall as the rows that do. */}
          <li className="flex min-h-15 items-center gap-3 px-6 py-3 text-muted-foreground">
            <CategoryDot colourSlot={null} />
            {UNCATEGORISED}
          </li>
        </ul>
      </Card>
    </main>
  )
}
