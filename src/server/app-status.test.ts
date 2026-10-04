import { describe, expect, it } from 'vitest'
import { getAppStatus } from '@/server/app-status'

describe('getAppStatus', () => {
  it('reads the status row seeded by the first migration', async () => {
    expect(await getAppStatus()).toBe('เชื่อมต่อฐานข้อมูลแล้ว')
  })
})
