import Link from 'next/link'
import { createCostItemAction } from '@/app/cost-list/actions'
import { CategoryDot } from '@/app/cost-list/category-dot'
import { CostItemForm } from '@/app/cost-list/cost-item-form'
import { OptionSelect } from '@/components/option-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UNCATEGORISED } from '@/lib/category-colours'
import { listCostCategories, type CostCategory } from '@/server/costs/cost-categories'
import { listCostItems, type CostItem } from '@/server/costs/cost-items'
import { requestClient } from '@/server/db/request-client'

// ?category= in the URL: a Cost Category's id, or this for ไม่มีหมวด.
const NONE = 'none'

export default async function CostListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const db = await requestClient()
  const { q, category, group } = await searchParams
  const search = typeof q === 'string' ? q : ''
  const filter = typeof category === 'string' ? category : ''
  const grouped = group === '1'
  const [items, categories] = await Promise.all([
    listCostItems(db, {
      search,
      categoryId: filter === NONE ? null : filter === '' ? undefined : filter,
    }),
    listCostCategories(db),
  ])
  // First run: the Cost List itself is empty, not just this search or filter.
  const firstRun = items.length === 0 && search === '' && filter === ''
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
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← กำไร
      </Link>
      <h1 className="mt-2 text-3xl">ลิสต์ต้นทุน</h1>

      <Card className={firstRun ? 'mt-8 border-2 border-dashed bg-transparent shadow-none' : 'mt-8'}>
        <CardHeader>
          <CardTitle>{firstRun ? 'เพิ่มรายการต้นทุนแรก' : 'เพิ่มรายการต้นทุน'}</CardTitle>
          {firstRun && (
            <CardDescription>
              ยังไม่มีรายการต้นทุน เริ่มจากสิ่งที่ซื้อมาใช้ เช่น มัทฉะ 4 ฿/g
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <CostItemForm
            action={createCostItemAction}
            initial={{ name: '', unitCost: '', unit: '', categoryId: null }}
            categories={categories}
            submitLabel="เพิ่ม"
          />
          <Button asChild variant="link" size="sm" className="mt-4">
            <Link href="/cost-list/categories">จัดการหมวดต้นทุน</Link>
          </Button>
        </CardContent>
      </Card>

      {!firstRun && (
        <form className="mt-8 flex flex-wrap items-center gap-3" role="search">
          <Input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="ค้นหาชื่อ"
            aria-label="ค้นหาชื่อ"
            className="flex-1 basis-48"
          />
          <OptionSelect
            name="category"
            aria-label="หมวด"
            defaultValue={filter}
            options={[
              { value: '', label: 'ทุกหมวด' },
              ...categories.map((c) => ({ value: c.id, label: c.name, dot: c.colourSlot })),
              { value: NONE, label: UNCATEGORISED, dot: null },
            ]}
            className="min-w-40"
          />
          <label className="flex items-center gap-2 px-1">
            <Checkbox name="group" value="1" defaultChecked={grouped} />
            จัดกลุ่มตามหมวด
          </label>
          <Button type="submit" variant="secondary">
            ค้นหา
          </Button>
        </form>
      )}

      {firstRun ? null : items.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {filter ? 'ไม่พบรายการในหมวดนี้' : `ไม่พบรายการที่ชื่อมี "${search.trim()}"`}
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.category?.id ?? NONE} className="mt-6">
            {grouped && (
              <h2 className="mb-2 flex items-center gap-2 text-lg">
                <CategoryDot colourSlot={g.category?.colourSlot ?? null} />
                {g.category?.name ?? UNCATEGORISED}
                <span className="font-sans text-sm text-muted-foreground">
                  {g.items.length} รายการ
                </span>
              </h2>
            )}
            <Card className="gap-0 py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">ชื่อ</TableHead>
                    {!grouped && <TableHead>หมวด</TableHead>}
                    <TableHead className="pr-6 text-right">ต้นทุนต่อหน่วย</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.items.map((item) => {
                    const itemCategory = item.categoryId ? categoryOf.get(item.categoryId) : undefined
                    return (
                      // The name links to the item; its ::after stretches over the whole row.
                      <TableRow key={item.id} className="relative hover:bg-accent focus-within:bg-accent">
                        <TableCell className="pl-6 text-base">
                          <Link
                            href={`/cost-list/${item.id}`}
                            className="outline-none after:absolute after:inset-0 focus-visible:underline"
                          >
                            {item.name}
                          </Link>
                        </TableCell>
                        {!grouped && (
                          <TableCell>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <CategoryDot colourSlot={itemCategory?.colourSlot ?? null} />
                              {itemCategory?.name ?? UNCATEGORISED}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="pr-6 text-right text-base tabular-nums">
                          {item.unitCost}
                          <span className="ml-1 text-sm text-muted-foreground">฿/{item.unit}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </section>
        ))
      )}
    </main>
  )
}
