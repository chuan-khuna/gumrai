// The picture beside the Seller's Display Name in the header: their Discord avatar when they
// have Discord bound, otherwise the first letter of their Display Name.

export type Avatar = { kind: 'image'; src: string } | { kind: 'initial'; letter: string }

// Supabase Auth's Discord provider always builds the avatar on Discord's CDN. Anything else
// is not shown.
const DISCORD_CDN = 'https://cdn.discordapp.com/'

const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })

/** The avatar for a Seller with this Display Name and Discord avatar (null when none). */
export function sellerAvatar(seller: { displayName: string; discordAvatarUrl: string | null }): Avatar {
  const url = seller.discordAvatarUrl
  if (url && url.startsWith(DISCORD_CDN)) return { kind: 'image', src: url }
  return { kind: 'initial', letter: initial(seller.displayName) }
}

// The first letter or digit, without the marks written over or under it (ร้าน gives ร). A name
// with neither, such as one emoji, gives its first whole character.
function initial(name: string) {
  const letter = name.match(/[\p{L}\p{N}]/u)?.[0]
  if (letter) return letter.toLocaleUpperCase('th')
  const first = graphemes.segment(name.trim())[Symbol.iterator]().next().value
  return first ? first.segment : '?'
}
