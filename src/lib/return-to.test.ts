import { describe, expect, it } from 'vitest'
import { loginPath, safeReturnTo } from '@/lib/return-to'

describe('safeReturnTo', () => {
  it('keeps a path on this site, with its query', () => {
    expect(safeReturnTo('/sheets/abc')).toBe('/sheets/abc')
    expect(safeReturnTo('/cost-list?q=นม&group=1')).toBe('/cost-list?q=นม&group=1')
  })

  it('defaults to the Cost Sheets page', () => {
    expect(safeReturnTo(undefined)).toBe('/sheets')
    expect(safeReturnTo('')).toBe('/sheets')
    expect(safeReturnTo(['/a', '/b'])).toBe('/sheets')
  })

  it('never leaves the site', () => {
    for (const away of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/\t/evil.example',
      'javascript:alert(1)',
      'sheets',
    ]) {
      expect(safeReturnTo(away)).toBe('/sheets')
    }
  })

  it('never returns to the login page', () => {
    expect(safeReturnTo('/login')).toBe('/sheets')
    expect(safeReturnTo('/login?next=/cost-list')).toBe('/sheets')
  })
})

describe('loginPath', () => {
  it('carries the page to return to', () => {
    expect(loginPath('/cost-list?q=a b')).toBe('/login?next=%2Fcost-list%3Fq%3Da%20b')
  })
})
