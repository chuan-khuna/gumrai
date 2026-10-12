import { CreateSheetForm } from '@/app/sheets/create-sheet-form'
import { SheetRow } from '@/app/sheets/sheet-row'
import { Composer } from '@/components/composer'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { listCostSheets } from '@/server/costs/cost-sheets'
import { requestClient } from '@/server/db/request-client'

// Read on every request, so the list always reflects the database.
export const dynamic = 'force-dynamic'

export default async function SheetsPage() {
  const db = await requestClient()
  const sheets = await listCostSheets(db)

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">ชีตต้นทุน</h1>

      {/* First run: no sheets yet, so the one thing to do is create the first. */}
      <Composer
        className="mt-8"
        title={sheets.length === 0 ? 'สร้างชีตแรก' : undefined}
        description="ตั้งชื่อสิ่งที่ขายเพื่อเริ่มคิดต้นทุนและกำไร"
      >
        <CreateSheetForm />
      </Composer>

      {sheets.length > 0 && (
        // Every figure is per Sale Unit, which each row names under the sheet's name.
        <Card className="mt-10 gap-0 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">ชื่อ</TableHead>
                <TableHead className="hidden text-right sm:table-cell">ราคาขาย (฿)</TableHead>
                <TableHead className="hidden text-right sm:table-cell">ต้นทุน (฿)</TableHead>
                <TableHead className="text-right">กำไรสุทธิ (฿)</TableHead>
                <TableHead className="w-0 pr-4">
                  <span className="sr-only">ตัวเลือก</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((sheet) => (
                <SheetRow key={sheet.id} sheet={sheet} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </main>
  )
}
