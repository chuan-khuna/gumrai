import { describe, expect, it } from 'vitest'
import { platformTake, platformTakeRate } from '@/lib/delivery'

// Ported from matcha-cafe's src/domain/delivery.test.ts: only the half that opens a Selling
// Price into what the platform takes. Price-from-profit is out of scope here.

describe('the Platform Take', () => {
  it('charges VAT on the commission, so a 33% GP takes 35.31%', () => {
    // 33 x 1.07 = 35.31, the figure a Grab merchant statement shows.
    expect(platformTakeRate({ gpRate: 0.33, vatRate: 0.07 })).toBeCloseTo(0.3531, 10)
  })

  it('takes nothing when there is no GP', () => {
    expect(platformTakeRate({ gpRate: 0, vatRate: 0.07 })).toBe(0)
  })

  it('opens a Selling Price into the commission, the VAT on it, and the Net Receipt', () => {
    const take = platformTake(100, { gpRate: 0.33, vatRate: 0.07 })
    // A hundred is chosen so the baht and the percentage are the same figure.
    expect(take.commission).toBeCloseTo(33, 10)
    expect(take.commissionVat).toBeCloseTo(2.31, 10)
    expect(take.totalDeduction).toBeCloseTo(35.31, 10)
    expect(take.netReceipt).toBeCloseTo(64.69, 10)
  })

  it('charges the VAT on the commission and never on the price', () => {
    const take = platformTake(100, { gpRate: 0.33, vatRate: 0.07 })
    // Adding the two rates instead of compounding them would put 7 here, and 40 in the
    // deduction. That is the mistake the sheet exists to head off.
    expect(take.commissionVat).toBeCloseTo(2.31, 10)
    expect(take.totalDeduction).toBeLessThan(40)
  })

  it('takes exactly what its own rate says, and the parts put the price back', () => {
    const take = platformTake(250, { gpRate: 0.3, vatRate: 0.07 })
    // 250 x 0.3 x 1.07 = 80.25
    expect(take.totalDeduction).toBeCloseTo(80.25, 9)
    expect(take.commission + take.commissionVat + take.netReceipt).toBeCloseTo(250, 9)
  })
})
