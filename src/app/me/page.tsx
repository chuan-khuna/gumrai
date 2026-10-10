import { redirect } from 'next/navigation'
import { ChangePasswordForm, DisplayNameForm, SetPasswordForm } from '@/app/me/account-forms'
import { signOutAction } from '@/app/login/actions'
import { deleteAccountAction } from '@/app/me/actions'
import { ConfirmAction } from '@/components/confirm-action'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { countAccountData, DELETE_CONFIRMATION, readAccount } from '@/server/auth/account'
import { MIN_PASSWORD_LENGTH } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// The signed-in Seller's account: Display Name, password, deleting the account, and signing
// out. Ticket 06 adds the ways of signing in as a further card, before the delete card.
export default async function MePage() {
  const db = await requestClient()
  const account = await readAccount(db)
  // The layout has already checked; this only narrows the type.
  if (!account) redirect('/login')
  const data = await countAccountData(db)

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
