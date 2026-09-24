/** Pricing engine — pure functions in major units of the base currency. */

const WEEKS_PER_YEAR = 52
const HOURS_PER_DAY = 8
const OK_RATIO = 0.9

export type BaselineInput = {
  income: number
  hoursPerWeek: number
  weeksOff: number
  monthlyCosts: number
  taxPct: number
  profitPct: number
}

export function annualBaseline(input: BaselineInput) {
  const workingWeeks = Math.max(1, WEEKS_PER_YEAR - input.weeksOff)
  const billableHours = workingWeeks * input.hoursPerWeek
  const netRatio = Math.max(0.05, 1 - input.taxPct / 100)
  // Income and costs are grossed up together (original defect #42 taxed income only).
  const grossNeeded = Math.round(
    ((input.income + input.monthlyCosts * 12) / netRatio) *
      (1 + input.profitPct / 100)
  )
  const hourly = Math.round(grossNeeded / Math.max(1, billableHours))
  return {
    workingWeeks,
    billableHours,
    grossNeeded,
    hourly,
    daily: hourly * HOURS_PER_DAY,
    monthlyTarget: Math.round(grossNeeded / 12),
  }
}

export type Verdict = 'good' | 'ok' | 'bad'

export function shouldAccept(
  offer: number,
  effortHours: number,
  hourly: number
) {
  const effective = effortHours > 0 ? offer / effortHours : 0
  const ratio = hourly > 0 ? effective / hourly : 0
  const verdict: Verdict =
    ratio >= 1 ? 'good' : ratio >= OK_RATIO ? 'ok' : 'bad'
  return {
    effective: Math.round(effective),
    verdict,
    gapPct: Math.round(Math.max(0, 1 - ratio) * 100),
    suggested: Math.round(effortHours * hourly),
  }
}
