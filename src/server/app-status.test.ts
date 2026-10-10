import { describe, expect, it } from 'vitest'
import { getAppStatus } from '@/server/app-status'
import { createServerClient } from '@/server/supabase'

// The secret-key client the app itself uses until sign-in lands (ticket 02).
const db = createServerClient()

describe('getAppStatus', () => {
  it('reads the status row seeded by the first migration', async () => {
    expect(await getAppStatus(db)).toBe('เชื่อมต่อฐานข้อมูลแล้ว')
  })
})
