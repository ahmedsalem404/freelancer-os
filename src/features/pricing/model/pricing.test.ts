import { describe, expect, it } from 'vitest'
import { annualBaseline, shouldAccept } from './pricing'

describe('annualBaseline', () => {
  const input = {
    income: 120000,
    hoursPerWeek: 25,
    weeksOff: 4,
    monthlyCosts: 1000,
    taxPct: 0,
    profitPct: 10,
  }

  it('derives billable hours from working weeks', () => {
    expect(annualBaseline(input).billableHours).toBe(48 * 25)
  })

  it('grosses up income and costs together before the margin', () => {
    // (120000 + 12000) / (1 - 0) * 1.10 = 145200
    expect(annualBaseline(input).grossNeeded).toBe(145200)
  })

  it('applies the tax reserve to costs as well (fixes original defect #42)', () => {
    const r = annualBaseline({ ...input, taxPct: 20, profitPct: 0 })
    expect(r.grossNeeded).toBe(165000)
  })

  it('computes hourly, daily and monthly targets', () => {
    const r = annualBaseline(input)
    expect(r.hourly).toBe(121)
    expect(r.daily).toBe(968)
    expect(r.monthlyTarget).toBe(12100)
  })
})

describe('shouldAccept', () => {
  it('accepts offers at or above the reference rate', () => {
    expect(shouldAccept(5000, 40, 120)).toMatchObject({
      effective: 125,
      verdict: 'good',
    })
  })

  it('marks offers within 10% below as ok', () => {
    expect(shouldAccept(4500, 40, 120).verdict).toBe('ok')
  })

  it('flags offers far below with the gap percentage', () => {
    expect(shouldAccept(3000, 40, 120)).toMatchObject({
      verdict: 'bad',
      gapPct: 38,
    })
  })

  it('suggests the price that matches the reference rate', () => {
    expect(shouldAccept(3000, 40, 120).suggested).toBe(4800)
  })
})
