import { SellerShell } from '@/app/seller-shell'

// Needs a signed-in Seller; see SellerShell.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>
}
