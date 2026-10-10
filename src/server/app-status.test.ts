import { describe, expect, it } from 'vitest'
import { getAppStatus } from '@/server/app-status'
import { createPublicClient } from '@/server/supabase'

// Signed out: the root page reads the status before anyone signs in.
const db = createPublicClient()

describe('getAppStatus', () => {
  it('reads the status row seeded by the first migration, with no one signed in', async () => {
    expect(await getAppStatus(db)).toBe('เชื่อมต่อฐานข้อมูลแล้ว')
  })
})
