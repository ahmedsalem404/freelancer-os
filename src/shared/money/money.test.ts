import { describe, expect, it } from 'vitest'
import { formatAmount, fromBase, money, toMinor } from './money'

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
