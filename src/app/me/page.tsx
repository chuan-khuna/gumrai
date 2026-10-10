import { redirect } from 'next/navigation'
import { ChangePasswordForm, DisplayNameForm, SetPasswordForm } from '@/app/me/account-forms'
import {
  bindDiscordAction,
  deleteAccountAction,
  unbindDiscordAction,
  unbindEmailAction,
} from '@/app/me/actions'
import { RevealOnArrival } from '@/app/me/reveal-on-arrival'
import { ShuffleAvatarButton } from '@/app/me/shuffle-avatar-button'
import { SubmitButton } from '@/app/me/submit-button'
import { SellerAvatar } from '@/app/seller-avatar'
import { ConfirmAction } from '@/components/confirm-action'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { loginPath } from '@/lib/return-to'
import {
  type AccountData,
  countAccountData,
  DELETE_CONFIRMATION,
  listSignInMethods,
  readAccount,
  type SignInMethod,
} from '@/server/auth/account'
import { currentSeller, MIN_PASSWORD_LENGTH, type Seller } from '@/server/auth/auth'
import { oauthFailureMessage } from '@/server/auth/oauth'
import { requestClient } from '@/server/db/request-client'

// The signed-in Seller's account: who they are at the top, then one section per setting, its
// heading in a column beside its controls on wide screens: Display Name, the
// ways to sign in, the password, and deleting the account. Signing out is in the header.
// ?bound=discord and ?error= come back from binding Discord through the OAuth callback.
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
  const lost = lostData(data)

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Identity seller={seller} email={account.email} methods={methods} />

      <div className="mt-12 grid gap-10">
        <Section id="name" title="ชื่อที่แสดง">
          <Card>
            <CardContent>
              <DisplayNameForm displayName={account.displayName} />
            </CardContent>
          </Card>
        </Section>

        <Section id="sign-in" title="วิธีเข้าสู่ระบบ">
          <SignInMethods
            methods={methods}
            email={account.email}
            bindError={oauthFailureMessage(error, 'bind')}
            justBound={bound === 'discord' && methods.includes('discord')}
          />
        </Section>

        <Section
          id="password"
          title={account.hasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน'}
        >
          <Card>
            <CardContent className="grid gap-5">
              <SignInEmail email={account.email} />
              {account.hasPassword ? (
                <ChangePasswordForm email={account.email ?? ''} minPasswordLength={MIN_PASSWORD_LENGTH} />
              ) : (
                <SetPasswordForm email={account.email ?? ''} minPasswordLength={MIN_PASSWORD_LENGTH} />
              )}
            </CardContent>
          </Card>
        </Section>

        <Section id="delete" title="ลบบัญชี">
          {/* Always says what goes, before the button: the impact is the point of this section. */}
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-loss-surface px-6 py-5">
            <div className="grid min-w-0 flex-1 basis-56 gap-2 text-sm">
              <p className="font-heading font-medium">ลบแล้วกู้คืนไม่ได้ สิ่งที่จะหายไป</p>
              <ul className="grid list-disc gap-1 pl-5 marker:text-loss">
                {lost.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
            <ConfirmAction
              action={deleteAccountAction}
              trigger="ลบบัญชี"
              title="ลบบัญชีนี้?"
              description={`${lost.join(' ')} จะถูกลบ ลบแล้วกู้คืนไม่ได้`}
              confirmLabel="ลบบัญชี"
              pendingLabel="กำลังลบ…"
              typeToConfirm={DELETE_CONFIRMATION}
            />
          </div>
        </Section>
      </div>
    </main>
  )
}

const count = new Intl.NumberFormat('th-TH')

// What deleting the account takes: the account itself (its name and ways to sign in go with
// it), then every count of what was made in it, zero included.
function lostData({ costSheets, costItems, costCategories }: AccountData): string[] {
  return [
    'บัญชีนี้',
    `ชีตต้นทุน ${count.format(costSheets)} ชีต`,
    `รายการต้นทุน ${count.format(costItems)} รายการ`,
    `หมวดต้นทุน ${count.format(costCategories)} หมวด`,
  ]
}

// A setting: its heading, then its controls. Side by side from md up, with a dashed rule
// between settings.
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="grid scroll-mt-6 gap-4 border-t border-dashed border-border pt-10 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10"
    >
      <h2 id={`${id}-title`} className="text-xl">
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

const METHOD_NAMES: Record<SignInMethod, string> = { email: 'อีเมลและรหัสผ่าน', discord: 'Discord' }

// Who the Seller is at a glance: avatar (with the dice that shuffles it), Display Name, email
// and the ways they sign in.
function Identity({ seller, email, methods }: { seller: Seller; email: string | null; methods: SignInMethod[] }) {
  return (
    <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
      <h1 className="sr-only">บัญชีของฉัน</h1>
      <div className="relative shrink-0">
        <SellerAvatar seller={seller} size="lg" />
        <ShuffleAvatarButton className="absolute -right-1 -bottom-1" />
      </div>
      <div className="grid min-w-0 gap-2">
        <p className="font-heading text-3xl leading-tight font-medium [overflow-wrap:anywhere] sm:text-4xl">
          {seller.displayName}
        </p>
        {email && <p className="text-muted-foreground [overflow-wrap:anywhere]">{email}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {methods.map((method) => (
            <Badge key={method} variant="linked">
              {METHOD_NAMES[method]}
            </Badge>
          ))}
        </div>
      </div>
    </header>
  )
}

// The email a password goes with, set apart so it is easy to spot.
function SignInEmail({ email }: { email: string | null }) {
  if (!email) return null
  return (
    <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
      อีเมล <span className="font-medium text-foreground">{email}</span>
    </p>
  )
}

// One way to sign in: what it is and what it signs in with, its state, and what can be done.
function MethodRow({
  name,
  detail,
  bound,
  action,
}: {
  name: string
  detail?: string | null
  bound: boolean
  action?: React.ReactNode
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5">
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <p className="flex flex-wrap items-center gap-2 font-heading font-medium">
          {name}
          <Badge variant={bound ? 'linked' : 'manual'}>{bound ? 'ใช้อยู่' : 'ยังไม่ได้ใช้'}</Badge>
        </p>
        {detail && <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{detail}</p>}
      </div>
      {action}
    </li>
  )
}

// The ways to sign in: email and password, and Discord. Each can be unbound while the other is
// bound; binding Discord goes through Discord; email and password is bound back by setting a
// password in the section below.
function SignInMethods({
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
    <div className="grid gap-4">
      <Card className="gap-0 py-0">
        <ul className="divide-y divide-dashed divide-border">
          <MethodRow
            name="อีเมลและรหัสผ่าน"
            detail={email}
            bound={hasEmail}
            action={
              !hasEmail ? (
                <Button asChild variant="outline" size="sm">
                  <a href="#password">ตั้งรหัสผ่าน</a>
                </Button>
              ) : (
                canUnbind && (
                  <ConfirmAction
                    action={unbindEmailAction}
                    trigger="เลิกใช้"
                    title="เลิกเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน?"
                    description="รหัสผ่านของบัญชีนี้จะถูกลบ หลังจากนี้เข้าสู่ระบบได้ด้วย Discord เท่านั้น ตั้งรหัสผ่านใหม่ได้ทุกเมื่อที่หน้านี้"
                    passwordLabel="รหัสผ่านปัจจุบัน"
                    confirmLabel="เลิกใช้"
                    pendingLabel="กำลังเลิกใช้…"
                  />
                )
              )
            }
          />
          <MethodRow
            name="Discord"
            bound={hasDiscord}
            action={
              hasDiscord ? (
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
                  <SubmitButton variant="outline" size="sm" pendingLabel="กำลังไปที่ Discord…">
                    ผูก Discord
                  </SubmitButton>
                </form>
              )
            }
          />
        </ul>
      </Card>

      {/* Back from Discord the page opens at the top, so the outcome scrolls itself into view. */}
      {bindError && (
        <RevealOnArrival>
          <p role="alert" className="text-sm text-loss">
            {bindError}
          </p>
        </RevealOnArrival>
      )}
      {justBound && (
        <RevealOnArrival>
          <p role="status" className="text-sm text-muted-foreground">
            ผูก Discord แล้ว
          </p>
        </RevealOnArrival>
      )}
    </div>
  )
}
