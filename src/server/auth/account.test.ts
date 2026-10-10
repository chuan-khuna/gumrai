import { afterEach, describe, expect, it } from 'vitest'
import {
  AccountError,
  changePassword,
  countAccountData,
  deleteAccount,
  listSignInMethods,
  readAccount,
  renameDisplayName,
  setFirstPassword,
  shuffleAvatarPattern,
  unbindSignInMethod,
} from '@/server/auth/account'
import { currentSeller } from '@/server/auth/auth'
import { createCostCategory } from '@/server/costs/cost-categories'
import { createCostItem } from '@/server/costs/cost-items'
import { createCostSheet, saveCostSheet } from '@/server/costs/cost-sheets'
import { createPublicClient } from '@/server/db/supabase'
import {
  adminClient,
  createDiscordOnlySeller,
  createDiscordSeller,
  createSeller,
  createSellerWithoutPassword,
  discordUser,
  emailIdentityVerified,
  identityProviders,
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

describe('Deleting the account', () => {
  // A Seller with one of everything they can own: a Cost Category, a Cost Item and a Cost
  // Sheet whose line links to the item (the case that needs delete_seller_sheets).
  async function sellerWithData(displayName: string) {
    const seller = await createSeller(displayName)
    const category = await createCostCategory(seller.db, 'หมวดทดสอบ')
    const item = await createCostItem(seller.db, { name: 'มัทฉะ', unitCost: '4', unit: 'g', categoryId: category.id })
    const sheet = await createCostSheet(seller.db, 'ชีตทดสอบ')
    await saveCostSheet(seller.db, sheet.id, {
      name: sheet.name,
      saleUnit: 'แก้ว',
      sellingPrice: '65',
      gpPercent: '0',
      vatPercent: '7',
      lines: [
        { costItemId: item.id, quantityUsed: '4' },
        { name: 'แก้ว', unitCost: '3', unit: 'ใบ', categoryId: null, quantityUsed: '1' },
      ],
    })
    return seller
  }

  // Every row the Seller owns, looked at past row-level security.
  async function rowsOwnedBy(id: string) {
    const admin = adminClient()
    const count = async (table: 'cost_category' | 'cost_item' | 'cost_sheet' | 'cost_line') => {
      const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true }).eq('owner', id)
      if (error) throw error
      return count
    }
    const profile = await admin.from('seller_profile').select('id', { count: 'exact', head: true }).eq('id', id)
    if (profile.error) throw profile.error
    const user = await admin.auth.admin.getUserById(id)
    return {
      user: user.data.user ? 1 : 0,
      seller_profile: profile.count,
      cost_category: await count('cost_category'),
      cost_item: await count('cost_item'),
      cost_sheet: await count('cost_sheet'),
      cost_line: await count('cost_line'),
    }
  }

  const ONE_OF_EACH = {
    user: 1,
    seller_profile: 1,
    // The three starting categories and the one made above.
    cost_category: 4,
    cost_item: 1,
    cost_sheet: 1,
    cost_line: 2,
  }

  it('counts the Cost Sheets and Cost Items that would be lost', async () => {
    const seller = await sellerWithData('ร้าน')

    expect(await countAccountData(seller.db)).toEqual({ costSheets: 1, costItems: 1 })
  })

  it('refuses any text but exactly "delete", in Thai, and deletes nothing', async () => {
    const seller = await sellerWithData('ร้าน')

    for (const text of ['', 'Delete', ' delete', 'delete ', 'ลบ']) {
      expect(await failure(deleteAccount(seller.db, text))).toBe('พิมพ์ delete เพื่อยืนยันการลบบัญชี')
    }

    expect(await rowsOwnedBy(seller.id)).toEqual(ONE_OF_EACH)
    expect(await currentSeller(seller.db)).toMatchObject({ id: seller.id })
  })

  it('removes the Seller and all their data, and signs them out', async () => {
    const seller = await sellerWithData('ร้าน')

    await deleteAccount(seller.db, 'delete')

    expect(await rowsOwnedBy(seller.id)).toEqual({
      user: 0,
      seller_profile: 0,
      cost_category: 0,
      cost_item: 0,
      cost_sheet: 0,
      cost_line: 0,
    })
    expect(await currentSeller(seller.db)).toBeNull()
    await expect(signIn(seller.email, seller.password)).rejects.toThrow()
  })

  it("leaves another Seller's data untouched", async () => {
    const leaving = await sellerWithData('ร้านที่ลบ')
    const staying = await sellerWithData('ร้านที่อยู่')

    await deleteAccount(leaving.db, 'delete')

    expect(await rowsOwnedBy(staying.id)).toEqual(ONE_OF_EACH)
    expect(await countAccountData(staying.db)).toEqual({ costSheets: 1, costItems: 1 })
  })

  it('refuses when no one is signed in', async () => {
    expect(await failure(deleteAccount(createPublicClient(), 'delete'))).toBe('ต้องเข้าสู่ระบบก่อน')
  })
})

describe('Avatar pattern', () => {
  it('starts each Seller with their own seed, and shuffling gives a new one', async () => {
    const seller = await createSeller()
    const other = await createSeller()
    const before = (await currentSeller(seller.db))!.avatarSeed
    expect((await currentSeller(other.db))!.avatarSeed).not.toBe(before)

    const shuffled = await shuffleAvatarPattern(seller.db)

    expect(shuffled).not.toBe(before)
    expect(await currentSeller(seller.db)).toMatchObject({ avatarSeed: shuffled })
    expect(await currentSeller(other.db)).not.toMatchObject({ avatarSeed: shuffled })
  })

  it('refuses when no one is signed in', async () => {
    expect(await failure(shuffleAvatarPattern(createPublicClient()))).toBe('ต้องเข้าสู่ระบบก่อน')
  })
})

describe('Ways to sign in', () => {
  it('lists email and password for a Seller who signed up with email', async () => {
    const seller = await createSeller()

    expect(await listSignInMethods(seller.db)).toEqual(['email'])
  })

  it('lists Discord alone for a Seller who signed up with Discord and has no password', async () => {
    const seller = await createDiscordOnlySeller()

    expect(await listSignInMethods(seller.db)).toEqual(['discord'])
  })

  it('lists both for a Seller with a password and Discord bound', async () => {
    const seller = await createDiscordSeller()

    expect(await listSignInMethods(seller.db)).toEqual(['email', 'discord'])
  })

  it('refuses to unbind the only way left to sign in', async () => {
    const byEmail = await createSeller()
    const byDiscord = await createDiscordOnlySeller()

    expect(await failure(unbindSignInMethod(byEmail.db, 'email'))).toBe(
      'ต้องเหลือวิธีเข้าสู่ระบบอย่างน้อยหนึ่งวิธี จึงเลิกใช้วิธีนี้ไม่ได้',
    )
    expect(await failure(unbindSignInMethod(byDiscord.db, 'discord'))).toBe(
      'ต้องเหลือวิธีเข้าสู่ระบบอย่างน้อยหนึ่งวิธี จึงเลิกใช้วิธีนี้ไม่ได้',
    )
    expect(await listSignInMethods(byEmail.db)).toEqual(['email'])
    expect(await identityProviders(byDiscord.id)).toEqual(['discord'])
    await signIn(byEmail.email, byEmail.password)
  })

  it('refuses to unbind a way the Seller does not use', async () => {
    const seller = await createSeller()

    expect(await failure(unbindSignInMethod(seller.db, 'discord'))).toBe('บัญชีนี้ไม่ได้ใช้วิธีนี้เข้าสู่ระบบ')
  })

  it('unbinds Discord, leaving email and password', async () => {
    const seller = await createDiscordSeller()

    await unbindSignInMethod(seller.db, 'discord')

    expect(await listSignInMethods(seller.db)).toEqual(['email'])
    expect(await identityProviders(seller.id)).toEqual(['email'])
    await signIn(seller.email, seller.password)
  })

  it('unbinds Discord from a Seller who signed up with Discord and set a password later', async () => {
    const seller = await createDiscordOnlySeller(discordUser(), { password: true })
    expect(await identityProviders(seller.id)).toEqual(['discord'])

    await unbindSignInMethod(seller.db, 'discord')

    expect(await identityProviders(seller.id)).toEqual(['email'])
    // Discord verified that email, so the email identity added before unlinking says so.
    expect(await emailIdentityVerified(seller.id)).toBe(true)
    const { data } = await adminClient().auth.admin.getUserById(seller.id)
    expect(data.user?.email).toBe(seller.email)
    expect(await listSignInMethods(await signIn(seller.email, seller.password))).toEqual(['email'])
  })

  it('unbinds email and password by clearing the password; setting one again binds it back', async () => {
    const seller = await createDiscordSeller()

    await unbindSignInMethod(seller.db, 'email', seller.password)

    expect(await listSignInMethods(seller.db)).toEqual(['discord'])
    expect(await readAccount(seller.db)).toMatchObject({ hasPassword: false })
    const { error } = await createPublicClient().auth.signInWithPassword({
      email: seller.email,
      password: seller.password,
    })
    expect(error?.code).toBe('invalid_credentials')

    await setFirstPassword(seller.db, 'a-new-password')
    expect(await listSignInMethods(seller.db)).toEqual(['email', 'discord'])
  })

  it('needs the current password to unbind email and password, as changing it does', async () => {
    const seller = await createDiscordSeller()

    expect(await failure(unbindSignInMethod(seller.db, 'email'))).toBe('ต้องใส่รหัสผ่านปัจจุบัน')
    expect(await failure(unbindSignInMethod(seller.db, 'email', 'not-the-password'))).toBe('รหัสผ่านปัจจุบันไม่ถูกต้อง')

    expect(await listSignInMethods(seller.db)).toEqual(['email', 'discord'])
    await signIn(seller.email, seller.password)
  })

  it('adds an email identity that does not claim the email is verified when nothing verified it', async () => {
    const seller = await createDiscordOnlySeller(discordUser({ emailVerified: false }), { password: true })

    const { error } = await seller.db.rpc('seller_add_email_identity')

    expect(error).toBeNull()
    expect(await identityProviders(seller.id)).toEqual(['discord', 'email'])
    expect(await emailIdentityVerified(seller.id)).toBe(false)
  })

  it('keeps the password in the database unless Discord is bound, whoever calls', async () => {
    const seller = await createSeller()

    const { error } = await seller.db.rpc('seller_clear_password')

    expect(error?.message).toBe('no other way to sign in')
    await signIn(seller.email, seller.password)
  })

  it('adds no email identity in the database to a Seller without a password', async () => {
    const seller = await createDiscordOnlySeller()

    const { error } = await seller.db.rpc('seller_add_email_identity')

    expect(error).toBeNull()
    expect(await identityProviders(seller.id)).toEqual(['discord'])
  })
})
