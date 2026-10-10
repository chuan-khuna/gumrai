import { afterEach, describe, expect, it } from 'vitest'
import { currentSeller } from '@/server/auth/auth'
import { finishOAuth, oauthCallbackUrl, oauthFailureMessage, startDiscordSignIn } from '@/server/auth/oauth'
import { listCostCategories } from '@/server/costs/cost-categories'
import { createSessionClient, type Db } from '@/server/db/supabase'
import {
  createDiscordSeller,
  createSeller,
  discordUser,
  removeSellers,
  signInAgainWithDiscord,
} from '@/server/testing/test-sellers'

afterEach(removeSellers)

// A request client over an in-memory cookie jar, as a server action or Route Handler has.
function cookieClient(): { db: Db; jar: Map<string, string> } {
  const jar = new Map<string, string>()
  const db = createSessionClient({
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll(cookies) {
      for (const { name, value } of cookies) {
        if (value === '') jar.delete(name)
        else jar.set(name, value)
      }
    },
  })
  return { db, jar }
}

// The callback's query, as Supabase Auth sends it back.
function callback(query: Record<string, string>) {
  return new URLSearchParams(query)
}

function errorOf(path: string) {
  return new URL(path, 'http://127.0.0.1:3000').searchParams.get('error')
}

describe('Starting to sign in with Discord', () => {
  it('goes to Supabase Auth for Discord, coming back to the callback with the return-to page', async () => {
    const { db, jar } = cookieClient()

    const url = new URL(await startDiscordSignIn(db, 'http://127.0.0.1:3000', '/cost-list?q=นม'))

    expect(`${url.origin}${url.pathname}`).toBe(`${process.env.SUPABASE_URL}/auth/v1/authorize`)
    expect(url.searchParams.get('provider')).toBe('discord')
    const back = new URL(url.searchParams.get('redirect_to') ?? '')
    expect(`${back.origin}${back.pathname}`).toBe('http://127.0.0.1:3000/auth/callback')
    expect(back.searchParams.get('next')).toBe('/cost-list?q=นม')
    expect(back.searchParams.get('flow')).toBe('sign-in')
    // PKCE: the verifier waits in a cookie for the callback.
    expect(url.searchParams.get('code_challenge_method')).toBe('s256')
    expect([...jar.keys()].some((name) => name.endsWith('-code-verifier'))).toBe(true)
  })

  it('never carries a return-to page off the site', () => {
    const back = new URL(oauthCallbackUrl('http://127.0.0.1:3000', 'sign-in', '//evil.example'))

    expect(back.searchParams.get('next')).toBe('/sheets')
  })
})

describe('Coming back from Discord', () => {
  it('goes back to the login page with a Thai message when the visitor cancelled', async () => {
    const { db } = cookieClient()

    const to = await finishOAuth(
      db,
      callback({
        flow: 'sign-in',
        next: '/sheets/abc',
        error: 'access_denied',
        error_description: 'The resource owner or authorization server denied the request',
      }),
    )

    expect(to).toBe('/login?next=%2Fsheets%2Fabc&error=cancelled')
    expect(oauthFailureMessage(errorOf(to))).toBe(
      'ยกเลิกการเข้าสู่ระบบด้วย Discord แล้ว ลองอีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลแทน',
    )
  })

  it('explains in Thai when the Discord account has no email', async () => {
    const { db } = cookieClient()

    const to = await finishOAuth(
      db,
      callback({
        next: '/sheets',
        error: 'server_error',
        error_code: 'unexpected_failure',
        error_description: 'Error getting user email from external provider',
      }),
    )

    expect(to).toBe('/login?next=%2Fsheets&error=no_email')
    expect(oauthFailureMessage(errorOf(to))).toBe(
      'บัญชี Discord นี้ไม่มีอีเมล เพิ่มอีเมลในบัญชี Discord ก่อน แล้วลองอีกครั้ง',
    )
  })

  it('explains in Thai when the Discord email is not verified', async () => {
    const { db } = cookieClient()

    const to = await finishOAuth(
      db,
      callback({
        error: 'access_denied',
        error_code: 'provider_email_needs_verification',
        error_description: 'Unverified email with discord.',
      }),
    )

    expect(errorOf(to)).toBe('unverified_email')
    expect(oauthFailureMessage('unverified_email')).toContain('ยังไม่ได้ยืนยัน')
  })

  it('says sign-in failed for any other error, or for no code at all', async () => {
    const { db } = cookieClient()

    const queries: Record<string, string>[] = [
      { error: 'server_error', error_description: 'Unable to exchange external code: abcd' },
      { error: 'invalid_request', error_code: 'bad_oauth_state', error_description: 'OAuth state has expired' },
      {},
    ]
    for (const query of queries) {
      expect(errorOf(await finishOAuth(db, callback(query)))).toBe('failed')
    }
    expect(oauthFailureMessage('failed')).toBe('เข้าสู่ระบบด้วย Discord ไม่สำเร็จ ลองอีกครั้ง')
  })

  it('fails without a session when the code cannot be exchanged (no code verifier)', async () => {
    const { db } = cookieClient()

    const to = await finishOAuth(db, callback({ next: '/me', code: '0b1a3a5e-3c1d-4c6e-9e0f-123456789abc' }))

    expect(to).toBe('/login?next=%2Fme&error=failed')
    expect(await currentSeller(db)).toBeNull()
  })

  it('never sends a failure off the site, and shows nothing for an unknown ?error=', async () => {
    const { db } = cookieClient()

    const to = await finishOAuth(db, callback({ next: 'https://evil.example', error: 'access_denied' }))

    expect(to).toBe('/login?next=%2Fsheets&error=cancelled')
    expect(oauthFailureMessage('<script>')).toBeNull()
    expect(oauthFailureMessage('toString')).toBeNull()
    expect(oauthFailureMessage(['cancelled'])).toBeNull()
  })
})

describe('A new Seller from Discord', () => {
  it('starts with their Discord display name as Display Name, and the starting Cost Categories', async () => {
    const seller = await createDiscordSeller(discordUser({ username: 'matcha.cafe', globalName: '  ร้านมัทฉะ ' }))

    expect(await currentSeller(seller.db)).toMatchObject({ displayName: 'ร้านมัทฉะ' })
    expect((await listCostCategories(seller.db)).map((c) => c.name)).toEqual([
      'วัตถุดิบ',
      'บรรจุภัณฑ์',
      'อื่น ๆ',
    ])
  })

  it('starts with their Discord username when they have no display name on Discord', async () => {
    const seller = await createDiscordSeller(discordUser({ username: 'matcha.cafe', globalName: '' }))

    expect(await currentSeller(seller.db)).toMatchObject({ displayName: 'matcha.cafe' })
  })

  it('keeps the Display Name when the Discord name changes later', async () => {
    const user = discordUser({ globalName: 'ร้านมัทฉะ' })
    const seller = await createDiscordSeller(user)

    await signInAgainWithDiscord(seller, { ...user, username: 'new.name', globalName: 'ชื่อใหม่บน Discord' })

    expect(await currentSeller(seller.db)).toMatchObject({ displayName: 'ร้านมัทฉะ' })
  })
})

describe("The header's avatar", () => {
  it("is the Discord avatar of a Seller with Discord bound, following Discord's changes", async () => {
    const user = discordUser({ avatar: 'a1b2c3' })
    const seller = await createDiscordSeller(user)

    expect(await currentSeller(seller.db)).toMatchObject({
      discordAvatarUrl: `https://cdn.discordapp.com/avatars/${user.id}/a1b2c3.png`,
    })

    await signInAgainWithDiscord(seller, { ...user, avatar: 'f00d' })
    expect(await currentSeller(seller.db)).toMatchObject({
      discordAvatarUrl: `https://cdn.discordapp.com/avatars/${user.id}/f00d.png`,
    })
  })

  it('is absent for a Seller without Discord, even with an avatar_url in their own metadata', async () => {
    const seller = await createSeller()
    const { error } = await seller.db.auth.updateUser({ data: { avatar_url: 'https://evil.example/x.png' } })
    if (error) throw error

    expect(await currentSeller(seller.db)).toMatchObject({ discordAvatarUrl: null })
  })
})
