import { sellerAvatar } from '@/lib/avatar'
import type { Seller } from '@/server/auth/auth'

// The Seller's Discord avatar, or the first letter of their Display Name when they have no
// Discord bound. Decorative: the Display Name is always written beside it.
export function SellerAvatar({ seller }: { seller: Seller }) {
  const avatar = sellerAvatar(seller)
  if (avatar.kind === 'image') {
    return (
      // A plain img: the avatar is a small picture on Discord's CDN, and next/image would need
      // that host allowed in the Next config for no gain.
      <img
        src={avatar.src}
        alt=""
        width={28}
        height={28}
        referrerPolicy="no-referrer"
        className="size-7 shrink-0 rounded-full bg-muted object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden
      className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
    >
      {avatar.letter}
    </span>
  )
}
