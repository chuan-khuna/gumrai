// What a selling platform withholds from a Selling Price. Ported from matcha-cafe's
// src/domain/delivery.ts, keeping only the forward half: Selling Price in, Net Receipt out.
// Computing a price from a wanted profit is out of scope (spec).
//
// What VAT is charged on: the platform's commission (GP) is a service it sells the seller,
// so VAT sits on the commission, not on the Selling Price. A 33% GP therefore takes
// 33% x 1.07 = 35.31% of the price (CONTEXT.md: Platform Take).

export interface DeliveryRates {
  /** GP, as a fraction of the Selling Price. */
  gpRate: number
  /** VAT on that commission, as a fraction. 0.07 in Thailand. */
  vatRate: number
}

/** The Platform Take as a fraction of the Selling Price: GP x (1 + VAT). */
export function platformTakeRate({ gpRate, vatRate }: DeliveryRates): number {
  return gpRate * (1 + vatRate)
}

/** One Selling Price, opened up into what the platform takes and what reaches the seller. */
export interface PlatformTake {
  price: number
  /** The share of `price` that never arrives: commission and its VAT together. */
  takeRate: number
  commission: number
  /** VAT on the commission. Never on `price`. */
  commissionVat: number
  /** commission + commissionVat: the Platform Take in baht. */
  totalDeduction: number
  /** `price` less the deduction: the Net Receipt. */
  netReceipt: number
}

export function platformTake(price: number, rates: DeliveryRates): PlatformTake {
  const commission = price * rates.gpRate
  const commissionVat = commission * rates.vatRate
  const totalDeduction = commission + commissionVat
  return {
    price,
    takeRate: platformTakeRate(rates),
    commission,
    commissionVat,
    totalDeduction,
    netReceipt: price - totalDeduction,
  }
}
