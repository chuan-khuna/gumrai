import BoringAvatar from 'boring-avatars'
import type { Seller } from '@/server/auth/auth'

// The pattern's colours: theme tokens, never written here (src/styles/presets/bubblegum.css).
const PATTERN = [1, 2, 3, 4, 5].map((n) => `var(--color-avatar-${n})`)

const SIZES = {
  sm: { pixels: 28, box: 'size-7' },
  lg: { pixels: 112, box: 'size-28' },
}

// The Seller's avatar: a Boring Avatars pattern drawn from their avatar seed, the same every
// time until they shuffle it at /me. Decorative: the Display Name is always written beside it.
export function SellerAvatar({ seller, size = 'sm' }: { seller: Seller; size?: keyof typeof SIZES }) {
  const { pixels, box } = SIZES[size]
  return (
    <span aria-hidden className={`${box} block shrink-0`}>
      <BoringAvatar name={seller.avatarSeed} variant="marble" colors={PATTERN} size={pixels} />
    </span>
  )
}
