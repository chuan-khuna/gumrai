import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAppStatus } from '@/server/app-status'

// Read on every request, so the page always reflects the database.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const status = await getAppStatus()

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-5xl font-semibold">กำไร</h1>
      <p className="mt-2 text-muted-foreground">คำนวณต้นทุนและกำไรของสิ่งที่คุณขาย</p>
      <Card size="sm" className="mt-8">
        <CardContent className="flex items-center gap-3">
          <span className="inline-block size-2.5 shrink-0 rounded-full bg-profit" />
          {status}
        </CardContent>
      </Card>
      <nav className="mt-8 flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/sheets">ชีตต้นทุน</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/cost-list">ลิสต์ต้นทุน</Link>
        </Button>
      </nav>
    </main>
  )
}
