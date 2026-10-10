import { afterEach, describe, expect, it } from 'vitest'
import {
  AccountError,
  changePassword,
  readAccount,
  renameDisplayName,
  setFirstPassword,
} from '@/server/auth/account'
import { currentSeller } from '@/server/auth/auth'
import { createPublicClient } from '@/server/db/supabase'
import {
  createSeller,
  createSellerWithoutPassword,
  removeSellers,
  signIn,
} from '@/server/testing/test-sellers'

afterEach(removeSellers)

async function failure(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(AccountError)
    return (error as AccountError).message
  }
  throw new Error('expected an AccountError')
}

describe('Reading the account', () => {
  it('shows the Display Name, email and that the Seller has a password', async () => {
    const seller = await createSeller('ร้านทดสอบ')

    expect(await readAccount(seller.db)).toEqual({
      id: seller.id,
      email: seller.email,
      displayName: 'ร้านทดสอบ',
      hasPassword: true,
    })
  })

  it('shows that a Seller who never set a password has none', async () => {
    const seller = await createSellerWithoutPassword()

    expect(await readAccount(seller.db)).toMatchObject({ id: seller.id, hasPassword: false })
  })

  it('is null when no one is signed in', async () => {
    expect(await readAccount(createPublicClient())).toBeNull()
  })
})

describe('Renaming the Display Name', () => {
  it('saves the new name trimmed, and the header shows it', async () => {
    const { db } = await createSeller('เดิม')

    expect(await renameDisplayName(db, '  ร้านใหม่ ')).toBe('ร้านใหม่')
    expect(await currentSeller(db)).toMatchObject({ displayName: 'ร้านใหม่' })
  })

  it('refuses a blank name and keeps the old one', async () => {
    const { db } = await createSeller('เดิม')

    expect(await failure(renameDisplayName(db, '   '))).toBe('ต้องใส่ชื่อที่แสดง')
    expect(await currentSeller(db)).toMatchObject({ displayName: 'เดิม' })
  })

  it('changes only the signed-in Seller', async () => {
    const a = await createSeller('ร้าน A')
    const b = await createSeller('ร้าน B')

    await renameDisplayName(b.db, 'ร้าน B ใหม่')

    expect(await currentSeller(a.db)).toMatchObject({ displayName: 'ร้าน A' })
  })

  it('refuses when no one is signed in', async () => {
    expect(await failure(renameDisplayName(createPublicClient(), 'ใคร'))).toBe('ต้องเข้าสู่ระบบก่อน')
  })
})

describe('Changing the password', () => {
  it('works with the right current password, and the new one signs in', async () => {
    const seller = await createSeller()

    await changePassword(seller.db, seller.password, 'brand-new-pass')

    const db = await signIn(seller.email, 'brand-new-pass')
    expect(await currentSeller(db)).toMatchObject({ id: seller.id })
    // This session stays signed in.
    expect(await currentSeller(seller.db)).toMatchObject({ id: seller.id })
  })

  it('stops the old password from signing in', async () => {
    const seller = await createSeller()

    await changePassword(seller.db, seller.password, 'brand-new-pass')

    await expect(signIn(seller.email, seller.password)).rejects.toThrow()
  })

  it('refuses a wrong current password, in Thai, and keeps the old password', async () => {
    const seller = await createSeller()

    const message = await failure(changePassword(seller.db, 'not-the-password', 'brand-new-pass'))

    expect(message).toBe('รหัสผ่านปัจจุบันไม่ถูกต้อง')
    await expect(signIn(seller.email, seller.password)).resolves.toBeDefined()
    await expect(signIn(seller.email, 'brand-new-pass')).rejects.toThrow()
  })

  it('refuses a new password shorter than 8 characters, in Thai', async () => {
    const seller = await createSeller()

    const message = await failure(changePassword(seller.db, seller.password, '1234567'))

    expect(message).toBe('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร')
  })

  it('refuses a new password that is the same as the current one', async () => {
    const seller = await createSeller()

    const message = await failure(changePassword(seller.db, seller.password, seller.password))

    expect(message).toBe('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม')
  })

  it('is refused for a Seller with no password, who sets one instead', async () => {
    const seller = await createSellerWithoutPassword()

    const message = await failure(changePassword(seller.db, 'anything', 'brand-new-pass'))

    expect(message).toBe('บัญชีนี้ยังไม่มีรหัสผ่าน ตั้งรหัสผ่านแทน')
  })
})

describe('Setting a first password', () => {
  it('needs no current password, and then the Seller signs in with their email and it', async () => {
    const seller = await createSellerWithoutPassword()

    await setFirstPassword(seller.db, 'first-password')

    expect(await readAccount(seller.db)).toMatchObject({ hasPassword: true })
    const db = await signIn(seller.email, 'first-password')
    expect(await currentSeller(db)).toMatchObject({ id: seller.id })
  })

  it('refuses a password shorter than 8 characters, in Thai', async () => {
    const seller = await createSellerWithoutPassword()

    const message = await failure(setFirstPassword(seller.db, 'short'))

    expect(message).toBe('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร')
    expect(await readAccount(seller.db)).toMatchObject({ hasPassword: false })
  })

  it('is refused for a Seller who already has a password, so the current one is never skipped', async () => {
    const seller = await createSeller()

    const message = await failure(setFirstPassword(seller.db, 'brand-new-pass'))

    expect(message).toBe('บัญชีนี้มีรหัสผ่านอยู่แล้ว เปลี่ยนรหัสผ่านแทน')
    await expect(signIn(seller.email, seller.password)).resolves.toBeDefined()
  })
})
