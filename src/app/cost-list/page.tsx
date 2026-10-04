import Link from 'next/link'
import { createCostItemAction } from '@/app/cost-list/actions'
import { CostItemForm } from '@/app/cost-list/cost-item-form'
import { listCostItems } from '@/server/cost-items'

export default async function CostListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { q } = await searchParams
  const search = typeof q === 'string' ? q : ''
  const items = await listCostItems({ search })

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
          initial={{ name: '', unitCost: '', unit: '' }}
          submitLabel="เพิ่ม"
        />
      </section>

      <form className="mt-8 flex gap-2" role="search">
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="ค้นหาชื่อ"
          aria-label="ค้นหาชื่อ"
          className="w-full rounded border border-line bg-card px-3 py-2"
        />
        <button type="submit" className="rounded border border-line px-4 py-2">
          ค้นหา
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 text-muted">
          {search ? `ไม่พบรายการที่ชื่อมี "${search.trim()}"` : 'ยังไม่มีรายการต้นทุน'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded border border-line bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/cost-list/${item.id}`}
                className="flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <span>{item.name}</span>
                <span className="whitespace-nowrap text-muted">
                  {item.unitCost} ฿/{item.unit}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
