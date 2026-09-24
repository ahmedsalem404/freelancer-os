import { describe, expect, it } from 'vitest'
import {
  convert,
  formatAmount,
  fromBase,
  money,
  ratesFromDaily,
  toMinor,
} from './money'

describe('daily exchange rate (quoted in YER)', () => {
  const daily = { day: '2026-09-25', sarInYer: 400, usdInYer: 1500 }

  it('derives SAR-based rates from the two YER quotes', () => {
    const rates = ratesFromDaily(daily)
    expect(rates.SAR).toBe(1)
    expect(rates.YER).toBeCloseTo(1 / 400)
    expect(rates.USD).toBeCloseTo(3.75)
  })

  it('converts between any two currencies through SAR', () => {
    const rates = ratesFromDaily(daily)
    expect(convert(toMinor(100), 'USD', 'YER', rates)).toBe(toMinor(150000))
    expect(convert(toMinor(400), 'YER', 'SAR', rates)).toBe(toMinor(1))
    expect(convert(toMinor(50), 'SAR', 'SAR', rates)).toBe(toMinor(50))
  })
})

describe('money quad', () => {
  it('computes base amount from the rate typed by the owner', () => {
    expect(money(toMinor(100), 'USD', 3.75)).toEqual({
      amount: 10000,
      currency: 'USD',
      rateToBase: 3.75,
      baseAmount: 37500,
    })
  })

  it('forces rate 1 for the base currency', () => {
    expect(money(25000, 'SAR', 2).rateToBase).toBe(1)
  })

  it('rounds base amounts to whole minor units', () => {
    expect(money(4500000, 'YER', 0.00235).baseAmount).toBe(10575)
  })
})

describe('display', () => {
  it('formats minor units with two decimals', () => {
    expect(formatAmount(125050)).toBe('1,250.50')
  })

  it('converts base amounts to USD for the report toggle', () => {
    expect(fromBase(37500, 3.75)).toBe(10000)
  })
})
