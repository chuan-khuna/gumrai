import { describe, expect, it } from 'vitest'
import { sellerAvatar } from '@/lib/avatar'

function initial(displayName: string) {
  return sellerAvatar({ displayName, discordAvatarUrl: null })
}

describe('sellerAvatar', () => {
  it('is the Discord avatar when the Seller has one', () => {
    const src = 'https://cdn.discordapp.com/avatars/123/a1b2.png'

    expect(sellerAvatar({ displayName: 'ร้านมัทฉะ', discordAvatarUrl: src })).toEqual({ kind: 'image', src })
  })

  it('is the first letter of the Display Name without Discord', () => {
    expect(initial('ร้านมัทฉะ')).toEqual({ kind: 'initial', letter: 'ร' })
    expect(initial('  matcha')).toEqual({ kind: 'initial', letter: 'M' })
    expect(initial('น้ำชา')).toEqual({ kind: 'initial', letter: 'น' })
    expect(initial('"7-Tea"')).toEqual({ kind: 'initial', letter: '7' })
  })

  it('falls back to the first character when the name has no letter', () => {
    expect(initial('🍵')).toEqual({ kind: 'initial', letter: '🍵' })
  })

  it('never shows a picture from anywhere but Discord', () => {
    expect(
      sellerAvatar({ displayName: 'ร้าน', discordAvatarUrl: 'https://evil.example/cdn.discordapp.com/x.png' }),
    ).toEqual({ kind: 'initial', letter: 'ร' })
  })
})
