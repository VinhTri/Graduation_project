import type {
  FinanceAmountDelta,
  FinanceCenterPeriod,
  FinanceCenterResponse,
  FinancePeriodSnapshot,
  FinanceSourceDelta,
  FinanceSourceFlow,
} from '@/shared/api/services/reportService'

export type { FinanceCenterPeriod, FinanceCenterResponse }

const EMPTY_FLOW: FinanceSourceFlow = { income: 0, expense: 0, net: 0 }

const EMPTY_SNAPSHOT: FinancePeriodSnapshot = {
  wallet: EMPTY_FLOW,
  cash: EMPTY_FLOW,
  fund: EMPTY_FLOW,
  totalIncome: 0,
  totalExpense: 0,
  net: 0,
}

const EMPTY_DELTA: FinanceAmountDelta = { amount: 0, percent: 0 }

const EMPTY_SOURCE_DELTA: FinanceSourceDelta = {
  income: EMPTY_DELTA,
  expense: EMPTY_DELTA,
  net: EMPTY_DELTA,
}

export function emptyFinanceCenter(
  period: FinanceCenterPeriod,
  date: Date,
  compareDate: Date,
): FinanceCenterResponse {
  return {
    period,
    currentLabel: periodLabel(period, date, false),
    compareLabel: periodLabel(period, compareDate, false),
    currentDate: toIsoDate(date),
    compareDate: toIsoDate(compareDate),
    walletBalance: 0,
    cashBalance: 0,
    totalAssets: 0,
    walletBalancePercent: 0,
    cashBalancePercent: 0,
    current: EMPTY_SNAPSHOT,
    compare: EMPTY_SNAPSHOT,
    delta: {
      wallet: EMPTY_SOURCE_DELTA,
      cash: EMPTY_SOURCE_DELTA,
      totalIncome: EMPTY_DELTA,
      totalExpense: EMPTY_DELTA,
      net: EMPTY_DELTA,
    },
    budget: {
      activeCount: 0,
      totalLimit: 0,
      spent: 0,
      remaining: 0,
      overLimitCount: 0,
      atRiskCount: 0,
      usagePercent: 0,
    },
  }
}

export function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function shiftPeriod(date: Date, period: FinanceCenterPeriod, dir: -1 | 1) {
  const next = new Date(date)
  if (period === 'WEEK') next.setDate(next.getDate() + dir * 7)
  else if (period === 'MONTH') next.setMonth(next.getMonth() + dir)
  else next.setFullYear(next.getFullYear() + dir)
  return next
}

export function previousPeriodDate(date: Date, period: FinanceCenterPeriod) {
  return shiftPeriod(date, period, -1)
}

export function canGoNextPeriod(date: Date, period: FinanceCenterPeriod) {
  return shiftPeriod(date, period, 1) <= new Date()
}

export function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function periodLabel(period: FinanceCenterPeriod, date: Date, isEn: boolean) {
  const now = new Date()
  if (period === 'WEEK') {
    const start = startOfWeek(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const sameWeek =
      startOfWeek(now).getTime() === start.getTime()
    if (sameWeek) return isEn ? 'This week' : 'Tuần này'
    return `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
  }
  if (period === 'YEAR') {
    if (date.getFullYear() === now.getFullYear()) return isEn ? 'This year' : 'Năm nay'
    return isEn ? `${date.getFullYear()}` : `Năm ${date.getFullYear()}`
  }
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return isEn ? 'This month' : 'Tháng này'
  }
  return isEn
    ? `${date.toLocaleString('en', { month: 'short' })} ${date.getFullYear()}`
    : `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`
}

export function num(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function formatDeltaPercent(percent: number | null | undefined, isEn: boolean) {
  if (percent == null) return isEn ? 'new' : 'mới'
  const rounded = Math.abs(percent) >= 10 ? percent.toFixed(0) : percent.toFixed(1)
  const sign = percent > 0 ? '+' : ''
  return `${sign}${rounded}%`
}
