import Link from 'next/link'
import { createCostItemAction } from '@/app/cost-list/actions'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { CostItemForm } from '@/app/cost-list/cost-item-form'
import { UNCATEGORISED } from '@/lib/category-colours'
import { listCostCategories, type CostCategory } from '@/server/cost-categories'
import { listCostItems, type CostItem } from '@/server/cost-items'

// ?category= in the URL: a Cost Category's id, or this for ไม่มีหมวด.
const NONE = 'none'

export default async function CostListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { q, category, group } = await searchParams
  const search = typeof q === 'string' ? q : ''
  const filter = typeof category === 'string' ? category : ''
  const grouped = group === '1'
  const [items, categories] = await Promise.all([
    listCostItems({
      search,
      categoryId: filter === NONE ? null : filter === '' ? undefined : filter,
    }),
    listCostCategories(),
  ])
  const categoryOf = new Map(categories.map((c) => [c.id, c]))

  // Grouped view: one section per Cost Category in its listed order, then ไม่มีหมวด.
  // Empty groups are left out.
  const groups: { category: CostCategory | null; items: CostItem[] }[] = grouped
    ? [...categories, null]
        .map((c) => ({ category: c, items: items.filter((i) => i.categoryId === (c?.id ?? null)) }))
        .filter((g) => g.items.length > 0)
    : [{ category: null, items }]

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-muted">
        ← กำไร
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">ลิสต์ต้นทุน</h1>

      <section className="mt-8 rounded border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">เพิ่มรายการต้นทุน</h2>
        <CostItemForm
          action={createCostItemAction}
          initial={{ name: '', unitCost: '', unit: '', categoryId: null }}
          categories={categories}
          submitLabel="เพิ่ม"
        />
        <Link href="/cost-list/categories" className="mt-3 inline-block text-sm text-accent">
          จัดการหมวดต้นทุน
        </Link>
      </section>

      <form className="mt-8 flex flex-wrap items-center gap-2" role="search">
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="ค้นหาชื่อ"
          aria-label="ค้นหาชื่อ"
          className="min-w-0 flex-1 rounded border border-line bg-card px-3 py-2"
        />
        <select
          name="category"
          defaultValue={filter}
          aria-label="หมวด"
          className="rounded border border-line bg-card px-3 py-2"
        >
          <option value="">ทุกหมวด</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NONE}>{UNCATEGORISED}</option>
        </select>
        <label className="flex items-center gap-2 px-1">
          <input type="checkbox" name="group" value="1" defaultChecked={grouped} />
          จัดกลุ่มตามหมวด
        </label>
        <button type="submit" className="rounded border border-line px-4 py-2">
          ค้นหา
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 text-muted">
          {filter
            ? 'ไม่พบรายการในหมวดนี้'
            : search
              ? `ไม่พบรายการที่ชื่อมี "${search.trim()}"`
              : 'ยังไม่มีรายการต้นทุน'}
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.category?.id ?? NONE} className="mt-6">
            {grouped && (
              <h2 className="mb-2 flex items-center gap-2 font-medium">
                <CategoryDot colourSlot={g.category?.colourSlot ?? null} />
                {g.category?.name ?? UNCATEGORISED}
                <span className="text-sm font-normal text-muted">{g.items.length} รายการ</span>
              </h2>
            )}
            <ul className="divide-y divide-line rounded border border-line bg-card">
              {g.items.map((item) => {
                const itemCategory = item.categoryId ? categoryOf.get(item.categoryId) : undefined
                return (
                  <li key={item.id}>
                    <Link
                      href={`/cost-list/${item.id}`}
                      className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                      <span className="flex items-baseline gap-2">
                        <CategoryDot colourSlot={itemCategory?.colourSlot ?? null} />
                        {item.name}
                        {!grouped && (
                          <span className="text-sm text-muted">
                            {itemCategory?.name ?? UNCATEGORISED}
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap text-muted">
                        {item.unitCost} ฿/{item.unit}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
