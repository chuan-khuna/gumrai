import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  currentSeller,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  SignInError,
} from '@/server/auth/auth'
import { listCostCategories } from '@/server/costs/cost-categories'
import { listCostItems } from '@/server/costs/cost-items'
import { listCostSheets } from '@/server/costs/cost-sheets'
import { createPublicClient, type Db } from '@/server/db/supabase'
import { createSeller, removeSellers, trackSeller } from '@/server/testing/test-sellers'

afterEach(removeSellers)

function newEmail() {
  return `signup-${randomUUID()}@gumrai.test`
}

// Signs up on a fresh client and records the new Seller for removal.
async function signUp(input: { email: string; password: string; displayName: string }) {
  const db = createPublicClient()
  await signUpWithEmail(db, input)
  const seller = await currentSeller(db)
  if (seller) trackSeller(seller.id)
  return { db, seller }
}

async function failure(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(SignInError)
    return (error as SignInError).message
  }
  throw new Error('expected a SignInError')
}

describe('Signing up with email', () => {
  it('signs the new Seller in at once, with their Display Name trimmed', async () => {
    const { seller } = await signUp({
      email: newEmail(),
      password: 'long-enough',
      displayName: '  ร้านมัทฉะ ',
    })

    expect(seller).toMatchObject({ displayName: 'ร้านมัทฉะ' })
  })

  it('gives a new Seller exactly the three starting Cost Categories and nothing else', async () => {
    const { db } = await signUp({ email: newEmail(), password: 'long-enough', displayName: 'ใหม่' })

    expect((await listCostCategories(db)).map((c) => c.name)).toEqual([
      'วัตถุดิบ',
      'บรรจุภัณฑ์',
      'อื่น ๆ',
    ])
    expect(await listCostItems(db)).toEqual([])
    expect(await listCostSheets(db)).toEqual([])
  })

  it('refuses a password shorter than 8 characters, in Thai', async () => {
    const db = createPublicClient()
    const message = await failure(
      signUpWithEmail(db, { email: newEmail(), password: '1234567', displayName: 'สั้น' }),
    )

    expect(message).toBe('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร')
    expect(await currentSeller(db)).toBeNull()
  })

  it('refuses an email that already has a Seller, in Thai', async () => {
    const taken = await createSeller()

    const message = await failure(
      signUpWithEmail(createPublicClient(), {
        email: taken.email,
        password: 'long-enough',
        displayName: 'ซ้ำ',
      }),
    )

    expect(message).toBe('อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน')
  })

  it('needs a Display Name', async () => {
    const message = await failure(
      signUpWithEmail(createPublicClient(), {
        email: newEmail(),
        password: 'long-enough',
        displayName: '   ',
      }),
    )

    expect(message).toBe('ต้องใส่ชื่อที่แสดง')
  })
})

describe('Signing in with email', () => {
  it('signs in with the right password', async () => {
    const seller = await createSeller('ร้านทดสอบ')
    const db = createPublicClient()

    await signInWithEmail(db, `  ${seller.email} `, seller.password)

    expect(await currentSeller(db)).toEqual({ id: seller.id, displayName: 'ร้านทดสอบ', avatarSeed: expect.any(String) })
  })

  it('refuses a wrong password, in Thai', async () => {
    const seller = await createSeller()
    const db = createPublicClient()

    const message = await failure(signInWithEmail(db, seller.email, 'not-the-password'))

    expect(message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    expect(await currentSeller(db)).toBeNull()
  })

  it('refuses an email with no Seller the same way as a wrong password', async () => {
    const message = await failure(signInWithEmail(createPublicClient(), newEmail(), 'whatever-1'))

    expect(message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  })
})

describe('Signing out', () => {
  it('ends the session, so the client is no one again', async () => {
    const { db } = await createSeller()

    await signOut(db)

    expect(await currentSeller(db)).toBeNull()
  })
})

describe('Signed out', () => {
  it('sees no Cost Items, Cost Categories or Cost Sheets at all', async () => {
    // The seeded test Seller owns sample data; a visitor who is not signed in sees none of it.
    const db: Db = createPublicClient()

    expect(await currentSeller(db)).toBeNull()
    expect(await listCostItems(db)).toEqual([])
    expect(await listCostCategories(db)).toEqual([])
    expect(await listCostSheets(db)).toEqual([])
  })
})
