import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { currentSeller } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// The frame around every page that needs a signed-in Seller: a header with their Display Name
// and ออกจากระบบ. The proxy has already sent signed-out visitors to the login page; this check
// is the one that trusts only a verified session.
export async function SellerShell({ children }: { children: React.ReactNode }) {
  const db = await requestClient()
  const seller = await currentSeller(db)
  if (!seller) redirect('/login')

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
            <span className="truncate text-sm" title={seller.displayName}>
              {seller.displayName}
            </span>
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
