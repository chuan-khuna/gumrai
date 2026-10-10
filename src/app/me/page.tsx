import { redirect } from 'next/navigation'
import { ChangePasswordForm, DisplayNameForm, SetPasswordForm } from '@/app/me/account-forms'
import { signOutAction } from '@/app/login/actions'
import { bindDiscordAction, deleteAccountAction, unbindDiscordAction, unbindEmailAction } from '@/app/me/actions'
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
import { MIN_PASSWORD_LENGTH } from '@/server/auth/auth'
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
  const account = await readAccount(db)
  // The layout has already checked; this only narrows the type.
  if (!account) redirect(loginPath('/me'))
  const [data, methods] = await Promise.all([countAccountData(db), listSignInMethods(db)])

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl">บัญชีของฉัน</h1>
      {account.email && <p className="mt-2 break-all text-muted-foreground">{account.email}</p>}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>ชื่อที่แสดง</CardTitle>
          <CardDescription>ชื่อที่เห็นมุมขวาบนของทุกหน้า</CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm displayName={account.displayName} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        {account.hasPassword ? (
          <>
            <CardHeader>
              <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm email={account.email ?? ''} minPasswordLength={MIN_PASSWORD_LENGTH} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>ตั้งรหัสผ่าน</CardTitle>
              <CardDescription>
                บัญชีนี้ยังไม่มีรหัสผ่าน ตั้งไว้แล้วจะเข้าสู่ระบบด้วยอีเมล {account.email} และรหัสผ่านนี้ได้ด้วย
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

// The ways to sign in: email and password, and Discord. Each can be unbound while the other is
// bound; binding Discord goes through Discord; email and password is bound back by setting a
// password in the card above.
function SignInMethodsCard({
  methods,
  bindError,
  justBound,
}: {
  methods: SignInMethod[]
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
        <CardDescription>เลิกใช้วิธีใดก็ได้ ตราบที่ยังเหลืออีกวิธีหนึ่ง</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <p>อีเมลและรหัสผ่าน</p>
            <Badge variant={hasEmail ? 'secondary' : 'manual'}>{hasEmail ? 'ใช้อยู่' : 'ยังไม่ได้ตั้งรหัสผ่าน'}</Badge>
          </div>
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
            <Badge variant={hasDiscord ? 'secondary' : 'manual'}>{hasDiscord ? 'ผูกแล้ว' : 'ยังไม่ได้ผูก'}</Badge>
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
        {!hasDiscord && (
          <p className="text-sm text-muted-foreground">
            แนะนำให้ผูก Discord ไว้ เพราะตอนนี้ยังรีเซ็ตรหัสผ่านไม่ได้ ถ้าลืมรหัสผ่าน จะยังเข้าบัญชีนี้ด้วย Discord ได้
          </p>
        )}
        {!canUnbind && (
          <p className="text-sm text-muted-foreground">วิธีที่เหลืออยู่วิธีเดียวเลิกใช้ไม่ได้ ถ้าไม่ใช้บัญชีนี้แล้ว ลบบัญชีด้านล่างแทน</p>
        )}
      </CardContent>
    </Card>
  )
}
