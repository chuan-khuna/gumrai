import Link from 'next/link'
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
    <main className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:pt-12">
      <Link href="/" className="font-heading text-2xl font-semibold hover:text-link">
        กำไร
      </Link>
      <h1 className="mt-10 text-3xl sm:text-4xl">เข้าสู่ระบบ</h1>
      <p className="mt-2 text-muted-foreground">เข้าสู่ระบบเพื่อดูชีตต้นทุนและลิสต์ต้นทุนของคุณ</p>

      {discordError && (
        <p role="alert" className="mt-6 rounded-lg bg-loss-surface px-3 py-2 text-sm text-foreground">
          {discordError}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 md:items-start">
        <Card>
          <CardHeader>
            <CardTitle>มีบัญชีอยู่แล้ว</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <form action={discordSignInAction}>
              <input type="hidden" name="next" value={returnTo} />
              <Button type="submit" variant="outline" className="w-full">
                เข้าสู่ระบบด้วย Discord
              </Button>
            </form>
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <span aria-hidden="true" className="flex-1 border-t border-dashed border-border" />
              หรือใช้อีเมล
              <span aria-hidden="true" className="flex-1 border-t border-dashed border-border" />
            </p>
            <SignInForm returnTo={returnTo} />
          </CardContent>
        </Card>

        {/* A first-run card: dashed, no fill (DESIGN.md § Card and money). */}
        <Card className="border-2 border-dashed border-border bg-transparent shadow-none">
          <CardHeader>
            <CardTitle>ยังไม่มีบัญชี</CardTitle>
            <CardDescription>
              สมัครด้วยอีเมลได้เลย ไม่ต้องยืนยันอีเมล หรือเข้าสู่ระบบด้วย Discord ครั้งแรกก็สร้างบัญชีให้เอง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm returnTo={returnTo} minPasswordLength={MIN_PASSWORD_LENGTH} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
