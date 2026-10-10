import { redirect } from 'next/navigation'
import { SignInForm, SignUpForm } from '@/app/login/login-forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { safeReturnTo } from '@/lib/return-to'
import { currentSeller, MIN_PASSWORD_LENGTH } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// Sign in, or sign up, with email. ?next= is the page to go to afterwards.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { next } = await searchParams
  const returnTo = safeReturnTo(next)
  // Already signed in: nothing to do here.
  const db = await requestClient()
  if (await currentSeller(db)) redirect(returnTo)

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">กำไร</h1>
      <p className="mt-2 text-muted-foreground">เข้าสู่ระบบเพื่อดูชีตต้นทุนและลิสต์ต้นทุนของคุณ</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <SignInForm returnTo={returnTo} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>สมัครใช้งาน</CardTitle>
          <CardDescription>ยังไม่มีบัญชี สมัครด้วยอีเมลได้เลย ไม่ต้องยืนยันอีเมล</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm returnTo={returnTo} minPasswordLength={MIN_PASSWORD_LENGTH} />
        </CardContent>
      </Card>
    </main>
  )
}
