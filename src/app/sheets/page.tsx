import Link from 'next/link'
import { CreateSheetForm } from '@/app/sheets/create-sheet-form'
import { SheetRow } from '@/app/sheets/sheet-row'
import { listCostSheets } from '@/server/cost-sheets'

// Read on every request, so the list always reflects the database.
export const dynamic = 'force-dynamic'

export default async function SheetsPage() {
  const sheets = await listCostSheets()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-muted">
        ← กำไร
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">ชีตต้นทุน</h1>

      <section className="mt-8 rounded border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">สร้างชีตใหม่</h2>
        <CreateSheetForm />
      </section>

      {sheets.length === 0 ? (
        <p className="mt-6 text-muted">ยังไม่มีชีตต้นทุน</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded border border-line bg-card">
          {sheets.map((sheet) => (
            <SheetRow key={sheet.id} sheet={sheet} />
          ))}
        </ul>
      )}
    </main>
  )
}
