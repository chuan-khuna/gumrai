import { redirect } from 'next/navigation'
import { discordSignInAction } from '@/app/login/actions'
import { SignInForm, SignUpForm } from '@/app/login/login-forms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { safeReturnTo } from '@/lib/return-to'
import { currentSeller, MIN_PASSWORD_LENGTH } from '@/server/auth/auth'
import { oauthFailureMessage } from '@/server/auth/oauth'
import { requestClient } from '@/server/db/request-client'

// Sign in with Discord or email, or sign up with email. ?next= is the page to go to
// afterwards. ?error= is set by the Discord callback when signing in with Discord failed.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { next, error } = await searchParams
  const returnTo = safeReturnTo(next)
  // Already signed in: nothing to do here.
  const db = await requestClient()
  if (await currentSeller(db)) redirect(returnTo)
  const discordError = oauthFailureMessage(error)

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">กำไร</h1>
      <p className="mt-2 text-muted-foreground">เข้าสู่ระบบเพื่อดูชีตต้นทุนและลิสต์ต้นทุนของคุณ</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form action={discordSignInAction} className="grid gap-3">
            <input type="hidden" name="next" value={returnTo} />
            {discordError && (
              <p role="alert" className="text-sm text-loss">
                {discordError}
              </p>
            )}
            <Button type="submit" variant="outline">
              เข้าสู่ระบบด้วย Discord
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">หรือใช้อีเมล</p>
          <SignInForm returnTo={returnTo} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>สมัครใช้งาน</CardTitle>
          <CardDescription>
            ยังไม่มีบัญชี สมัครด้วยอีเมลได้เลย ไม่ต้องยืนยันอีเมล หรือเข้าสู่ระบบด้วย Discord ครั้งแรกก็สร้างบัญชีให้เอง
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm returnTo={returnTo} minPasswordLength={MIN_PASSWORD_LENGTH} />
        </CardContent>
      </Card>
    </main>
  )
}
