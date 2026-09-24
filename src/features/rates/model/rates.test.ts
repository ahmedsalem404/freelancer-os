import { convert, toMinor } from '@/shared/money/money'
import { describe, expect, it } from 'vitest'
import { ratesFromDaily } from './rates'

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
