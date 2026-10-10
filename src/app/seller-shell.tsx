import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/app/login/actions'
import { SellerAvatar } from '@/app/seller-avatar'
import { loginPath, RETURN_TO_HEADER } from '@/lib/return-to'
import { Button } from '@/components/ui/button'
import { currentSeller } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// The frame around every page that needs a signed-in Seller: a header with their avatar and
// Display Name (a link to /me) and ออกจากระบบ. The proxy has already sent signed-out visitors to the login
// page; this check is the one that trusts only a verified session. It too keeps the page they
// were going to, which the proxy passes on in RETURN_TO_HEADER.
export async function SellerShell({ children }: { children: React.ReactNode }) {
  const db = await requestClient()
  const seller = await currentSeller(db)
  if (!seller) redirect(loginPath((await headers()).get(RETURN_TO_HEADER) ?? ''))

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <nav className="flex items-center gap-4">
            <Link href="/sheets" className="text-sm text-muted-foreground hover:text-foreground">
              ชีตต้นทุน
            </Link>
            <Link href="/cost-list" className="text-sm text-muted-foreground hover:text-foreground">
              ลิสต์ต้นทุน
            </Link>
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <Link
              href="/me"
              className="flex min-w-0 items-center gap-2 text-sm hover:text-link"
              title={`${seller.displayName} · บัญชีของฉัน`}
            >
              <SellerAvatar seller={seller} />
              <span className="truncate">{seller.displayName}</span>
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
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
