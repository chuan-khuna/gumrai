import { getAppStatus } from '@/server/app-status'

// Read on every request, so the page always reflects the database.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const status = await getAppStatus()

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">กำไร</h1>
      <p className="mt-2 text-muted">คำนวณต้นทุนและกำไรของสิ่งที่คุณขาย</p>
      <p className="mt-8 rounded border border-line bg-card px-4 py-3">
        <span className="mr-2 inline-block size-2 rounded-full bg-profit align-middle" />
        {status}
      </p>
    </main>
  )
}
