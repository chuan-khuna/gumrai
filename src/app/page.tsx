import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { currentSeller } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// The public landing page: anyone may open it, and a signed-in Seller stays here too. Only the
// main button changes. This is the skeleton; the landing copy and visuals are a later design task.
// Reading the session cookies makes the page render on every request.
export default async function LandingPage() {
  const db = await requestClient()
  const seller = await currentSeller(db)

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-5xl font-semibold">กำไร</h1>
      <p className="mt-2 text-muted-foreground">คำนวณต้นทุนและกำไรของสิ่งที่คุณขาย</p>
      <div className="mt-8">
        {seller ? (
          <Button asChild size="lg">
            <Link href="/sheets">ไปที่ชีตต้นทุน</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href="/login">เริ่มใช้งาน</Link>
          </Button>
        )}
      </div>
    </main>
  )
}
