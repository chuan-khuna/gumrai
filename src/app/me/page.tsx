import { redirect } from 'next/navigation'
import { ChangePasswordForm, DisplayNameForm, SetPasswordForm } from '@/app/me/account-forms'
import { signOutAction } from '@/app/login/actions'
import {
  bindDiscordAction,
  deleteAccountAction,
  shuffleAvatarPatternAction,
  unbindDiscordAction,
  unbindEmailAction,
} from '@/app/me/actions'
import { SellerAvatar } from '@/app/seller-avatar'
import { ConfirmAction } from '@/components/confirm-action'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginPath } from '@/lib/return-to'
import {
  countAccountData,
  DELETE_CONFIRMATION,
  listSignInMethods,
  readAccount,
  type SignInMethod,
} from '@/server/auth/account'
import { currentSeller, MIN_PASSWORD_LENGTH, type Seller } from '@/server/auth/auth'
import { oauthFailureMessage } from '@/server/auth/oauth'
import { requestClient } from '@/server/db/request-client'

// The signed-in Seller's account: Display Name, password, the ways to sign in, deleting the
// account, and signing out. ?bound=discord and ?error= come back from binding Discord through
// the OAuth callback.
export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { bound, error } = await searchParams
  const db = await requestClient()
  const [account, seller] = await Promise.all([readAccount(db), currentSeller(db)])
  // The layout has already checked; this only narrows the type.
  if (!account || !seller) redirect(loginPath('/me'))
  const [data, methods] = await Promise.all([countAccountData(db), listSignInMethods(db)])

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl">บัญชีของฉัน</h1>

      <SummaryCard seller={seller} email={account.email} methods={methods} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ชื่อที่แสดง</CardTitle>
          <CardDescription>ชื่อที่เห็นมุมขวาบนของทุกหน้า</CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm displayName={account.displayName} />
        </CardContent>
      </Card>

      <Card id="password" className="mt-6 scroll-mt-6">
        {account.hasPassword ? (
          <>
            <CardHeader>
              <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
              <CardDescription>
                <SignInEmail email={account.email} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm email={account.email ?? ''} minPasswordLength={MIN_PASSWORD_LENGTH} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>ตั้งรหัสผ่าน</CardTitle>
              <CardDescription className="grid gap-1">
                <span>ตั้งไว้แล้วจะเข้าสู่ระบบด้วยอีเมลนี้และรหัสผ่านได้ด้วย</span>
                <SignInEmail email={account.email} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SetPasswordForm email={account.email ?? ''} minPasswordLength={MIN_PASSWORD_LENGTH} />
            </CardContent>
          </>
        )}
      </Card>

      <SignInMethodsCard
        methods={methods}
        email={account.email}
        bindError={oauthFailureMessage(error, 'bind')}
        justBound={bound === 'discord' && methods.includes('discord')}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ลบบัญชี</CardTitle>
          <CardDescription>ลบบัญชีและข้อมูลทั้งหมดของคุณ ลบแล้วกู้คืนไม่ได้</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmAction
            action={deleteAccountAction}
            trigger="ลบบัญชี"
            size="default"
            title="ลบบัญชีนี้?"
            description={`ชีตต้นทุน ${data.costSheets} ชีต รายการต้นทุน ${data.costItems} รายการ หมวดต้นทุน และชื่อที่แสดงของคุณจะถูกลบทั้งหมด ลบแล้วกู้คืนไม่ได้`}
            confirmLabel="ลบบัญชี"
            pendingLabel="กำลังลบ…"
            typeToConfirm={DELETE_CONFIRMATION}
          />
        </CardContent>
      </Card>

      <form action={signOutAction} className="mt-8">
        <Button type="submit" variant="secondary">
          ออกจากระบบ
        </Button>
      </form>
    </main>
  )
}

const METHOD_NAMES: Record<SignInMethod, string> = { email: 'อีเมลและรหัสผ่าน', discord: 'Discord' }

// Who the Seller is at a glance: avatar, Display Name, email and the ways they sign in.
function SummaryCard({ seller, email, methods }: { seller: Seller; email: string | null; methods: SignInMethod[] }) {
  return (
    <Card className="mt-8">
      <CardContent className="grid gap-5">
        <div className="flex items-center gap-4">
          <SellerAvatar seller={seller} size="lg" />
          <div className="grid min-w-0 gap-1">
            <p className="truncate font-heading text-xl">{seller.displayName}</p>
            {email && <p className="break-all text-sm text-muted-foreground">{email}</p>}
            <div className="flex flex-wrap gap-1.5">
              {methods.map((method) => (
                <Badge key={method} variant="secondary">
                  {METHOD_NAMES[method]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <form action={shuffleAvatarPatternAction} className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" size="sm">
            สุ่มลายใหม่
          </Button>
          <p className="text-sm text-muted-foreground">กดได้เรื่อย ๆ จนกว่าจะได้ลายที่ชอบ</p>
        </form>
      </CardContent>
    </Card>
  )
}

// The email a password goes with, set apart so it is easy to spot.
function SignInEmail({ email }: { email: string | null }) {
  if (!email) return null
  return (
    <span className="break-all">
      อีเมล <span className="font-medium text-foreground">{email}</span>
    </span>
  )
}

// The ways to sign in: email and password, and Discord. Each can be unbound while the other is
// bound; binding Discord goes through Discord; email and password is bound back by setting a
// password in the card above.
function SignInMethodsCard({
  methods,
  email,
  bindError,
  justBound,
}: {
  methods: SignInMethod[]
  email: string | null
  bindError: string | null
  justBound: boolean
}) {
  const hasEmail = methods.includes('email')
  const hasDiscord = methods.includes('discord')
  const canUnbind = methods.length > 1

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>วิธีเข้าสู่ระบบ</CardTitle>
        <CardDescription>ใช้ทั้งสองวิธีได้ และเข้าสู่ระบบด้วยวิธีไหนก็ได้</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <p>อีเมลและรหัสผ่าน</p>
            {email && <p className="break-all text-sm text-muted-foreground">{email}</p>}
            <Badge variant={hasEmail ? 'secondary' : 'manual'}>{hasEmail ? 'ใช้อยู่' : 'ยังไม่ได้ใช้'}</Badge>
          </div>
          {!hasEmail && (
            <Button asChild variant="outline" size="sm">
              <a href="#password">ตั้งรหัสผ่าน</a>
            </Button>
          )}
          {hasEmail && canUnbind && (
            <ConfirmAction
              action={unbindEmailAction}
              trigger="เลิกใช้"
              title="เลิกเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน?"
              description="รหัสผ่านของบัญชีนี้จะถูกลบ หลังจากนี้เข้าสู่ระบบได้ด้วย Discord เท่านั้น ตั้งรหัสผ่านใหม่ได้ทุกเมื่อที่หน้านี้"
              passwordLabel="รหัสผ่านปัจจุบัน"
              confirmLabel="เลิกใช้"
              pendingLabel="กำลังเลิกใช้…"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <p>Discord</p>
            <Badge variant={hasDiscord ? 'secondary' : 'manual'}>{hasDiscord ? 'ใช้อยู่' : 'ยังไม่ได้ใช้'}</Badge>
          </div>
          {hasDiscord ? (
            canUnbind && (
              <ConfirmAction
                action={unbindDiscordAction}
                trigger="เลิกผูก"
                title="เลิกผูก Discord?"
                description="หลังจากนี้เข้าสู่ระบบด้วย Discord ไม่ได้ ใช้อีเมลและรหัสผ่านแทน ผูกใหม่ได้ทุกเมื่อที่หน้านี้"
                confirmLabel="เลิกผูก"
                pendingLabel="กำลังเลิกผูก…"
              />
            )
          ) : (
            <form action={bindDiscordAction}>
              <Button type="submit" variant="outline" size="sm">
                ผูก Discord
              </Button>
            </form>
          )}
        </div>

        {bindError && (
          <p role="alert" className="text-sm text-loss">
            {bindError}
          </p>
        )}
        {justBound && (
          <p role="status" className="text-sm text-muted-foreground">
            ผูก Discord แล้ว
          </p>
        )}
        {/* With one way left it cannot be unbound, so say why and point to the other. */}
        {!hasDiscord && (
          <p className="text-sm text-muted-foreground">
            ตอนนี้เข้าสู่ระบบได้ด้วยรหัสผ่านทางเดียว แนะนำให้ผูก Discord ไว้ด้วย
            เพราะยังรีเซ็ตรหัสผ่านไม่ได้ ถ้าลืมรหัสผ่าน จะยังเข้าบัญชีนี้ด้วย Discord ได้
          </p>
        )}
        {!hasEmail && (
          <p className="text-sm text-muted-foreground">
            ตอนนี้เข้าสู่ระบบได้ด้วย Discord ทางเดียว แนะนำให้ตั้งรหัสผ่านไว้ด้วย
            ถ้าเข้า Discord ไม่ได้ จะยังเข้าบัญชีนี้ด้วยอีเมลและรหัสผ่านได้
          </p>
        )}
      </CardContent>
    </Card>
  )
}
