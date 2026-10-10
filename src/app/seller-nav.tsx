'use client'

import { FileSpreadsheet, ShoppingBasket, Tags } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'

// The Seller sections, as a pill track in the header. The section the page belongs to is
// raised out of the track like a card, so where you are reads at a glance.
const SECTIONS = [
  { href: '/sheets', label: 'ชีตต้นทุน', icon: FileSpreadsheet },
  { href: '/cost-list', label: 'ลิสต์ต้นทุน', icon: ShoppingBasket },
  { href: '/cost-list/categories', label: 'หมวดต้นทุน', icon: Tags },
]

// The section with the longest href the path sits under, so /cost-list/categories is หมวดต้นทุน
// and /cost-list/<id> is ลิสต์ต้นทุน. Null on a page outside every section, such as /me.
function currentSection(pathname: string) {
  const matches = SECTIONS.filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
}

export function SellerNav({ className }: { className?: string }) {
  const current = currentSection(usePathname())

  return (
    <nav aria-label="ส่วนของแอป" className={cn('flex rounded-full bg-muted p-1', className)}>
      {SECTIONS.map(({ href, label, icon: Icon }) => {
        const active = href === current
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-heading text-sm whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ease-press outline-none focus-visible:ring-3 focus-visible:ring-ring sm:flex-none sm:px-4',
              active
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon
              aria-hidden
              className={cn('hidden size-4 sm:block', active ? 'text-primary-edge' : 'text-current')}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

// The account pill: avatar and Display Name, raised the same way while on /me.
export function AccountLink({ name, children }: { name: string; children: React.ReactNode }) {
  const active = usePathname() === '/me'
  return (
    <Link
      href="/me"
      aria-current={active ? 'page' : undefined}
      title={`${name} · บัญชีของฉัน`}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-full py-1 pr-1 pl-1 text-sm transition-[background-color,box-shadow] duration-150 ease-press outline-none focus-visible:ring-3 focus-visible:ring-ring min-[400px]:pr-3',
        active ? 'bg-card shadow-card' : 'hover:bg-accent',
      )}
    >
      {children}
      <span className="hidden max-w-36 truncate min-[400px]:inline">{name}</span>
    </Link>
  )
}
