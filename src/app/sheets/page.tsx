import { CreateSheetForm } from '@/app/sheets/create-sheet-form'
import { SheetRow } from '@/app/sheets/sheet-row'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listCostSheets } from '@/server/costs/cost-sheets'
import { requestClient } from '@/server/db/request-client'

// Read on every request, so the list always reflects the database.
export const dynamic = 'force-dynamic'

export default async function SheetsPage() {
  const db = await requestClient()
  const sheets = await listCostSheets(db)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl">ชีตต้นทุน</h1>

      {sheets.length === 0 ? (
        // First run: no sheets yet, so the one thing to do is create the first.
        <Card className="mt-8 border-2 border-dashed bg-transparent shadow-none">
          <CardHeader>
            <CardTitle>สร้างชีตแรก</CardTitle>
            <CardDescription>
              ยังไม่มีชีตต้นทุน ตั้งชื่อสิ่งที่ขายเพื่อเริ่มคิดต้นทุนและกำไร
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateSheetForm />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>สร้างชีตใหม่</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateSheetForm />
            </CardContent>
          </Card>
          <ul className="mt-6 grid gap-3">
            {sheets.map((sheet) => (
              <SheetRow key={sheet.id} sheet={sheet} />
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
