import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/app/login/actions'
import { SellerAvatar } from '@/app/seller-avatar'
import { AccountLink, SellerNav } from '@/app/seller-nav'
import { Wordmark } from '@/components/wordmark'
import { loginPath, RETURN_TO_HEADER } from '@/lib/return-to'
import { Button } from '@/components/ui/button'
import { currentSeller } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// The frame around every page that needs a signed-in Seller: a header with the wordmark, the
// sections (SellerNav), their avatar and Display Name (a link to /me) and ออกจากระบบ. The proxy has already sent signed-out visitors to the login
// page; this check is the one that trusts only a verified session. It too keeps the page they
// were going to, which the proxy passes on in RETURN_TO_HEADER.
export async function SellerShell({ children }: { children: React.ReactNode }) {
  const db = await requestClient()
  const seller = await currentSeller(db)
  if (!seller) redirect(loginPath((await headers()).get(RETURN_TO_HEADER) ?? ''))

  return (
    <>
      {/* Phones: the wordmark and the account on one row, the sections full width below. */}
      <header className="border-b border-dashed border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          {/* The screen's one bubble (DESIGN.md § The bubble). Not a link: the bubble is a button. */}
          <Wordmark className="text-3xl" />
          <SellerNav className="order-last w-full sm:order-none sm:w-auto" />
          <div className="ml-auto flex min-w-0 items-center gap-1">
            <AccountLink name={seller.displayName}>
              <SellerAvatar seller={seller} />
            </AccountLink>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                ออกจากระบบ
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
