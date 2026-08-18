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

export function clampShare(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (value >= 100) return 100
  return value
}

export function flowVolume(flow: FinanceSourceFlow) {
  return Math.abs(num(flow.income)) + Math.abs(num(flow.expense))
}

export function buildInsights(
  data: FinanceCenterResponse,
  isEn: boolean,
  formatMoney: (value: number) => string,
) {
  const lines: string[] = []
  const walletShare = clampShare(num(data.walletBalancePercent))
  const cashShare = clampShare(num(data.cashBalancePercent))
  if (num(data.totalAssets) > 0) {
    lines.push(
      isEn
        ? `Assets sit ${walletShare.toFixed(0)}% in wallet and ${cashShare.toFixed(0)}% in cash.`
        : `Tài sản đang nằm ${walletShare.toFixed(0)}% ở ví và ${cashShare.toFixed(0)}% ở tiền mặt.`,
    )
  }

  const walletExpense = num(data.current.wallet.expense)
  const cashExpense = num(data.current.cash.expense)
  const expenseDiff = walletExpense - cashExpense
  if (walletExpense > 0 || cashExpense > 0) {
    if (expenseDiff === 0) {
      lines.push(
        isEn
          ? 'Wallet and cash spending are about even this period.'
          : 'Chi ví và chi tiền mặt kỳ này gần bằng nhau.',
      )
    } else {
      const higherIsWallet = expenseDiff > 0
      const base = higherIsWallet ? cashExpense : walletExpense
      const pct = base > 0 ? (Math.abs(expenseDiff) / base) * 100 : null
      const pctText = pct == null ? '' : ` (${formatDeltaPercent(pct, isEn)})`
      lines.push(
        isEn
          ? `${higherIsWallet ? 'Wallet' : 'Cash'} spending is higher by ${formatMoney(Math.abs(expenseDiff))}${pctText}.`
          : `Kỳ này chi ${higherIsWallet ? 'ví' : 'tiền mặt'} cao hơn ${higherIsWallet ? 'sổ tay' : 'ví'} ${formatMoney(Math.abs(expenseDiff))}${pctText}.`,
      )
    }
  }

  const netDelta = num(data.delta.net.amount)
  if (netDelta !== 0) {
    lines.push(
      isEn
        ? `Net cash flow ${netDelta > 0 ? 'rose' : 'fell'} ${formatMoney(Math.abs(netDelta))} vs ${data.compareLabel}.`
        : `Dòng tiền ròng ${netDelta > 0 ? 'tăng' : 'giảm'} ${formatMoney(Math.abs(netDelta))} so với ${data.compareLabel}.`,
    )
  }

  return lines
}

export function buildExportText(
  data: FinanceCenterResponse,
  isEn: boolean,
  formatMoney: (value: number) => string,
) {
  const insights = buildInsights(data, isEn, formatMoney)
  const title = isEn ? 'SmartSpend financial report' : 'Báo cáo trung tâm tài chính SmartSpend'
  const lines = [
    title,
    `${data.currentLabel}  vs  ${data.compareLabel}`,
    '',
    isEn ? 'Balances' : 'Số dư',
    `${isEn ? 'Total assets' : 'Tổng tài sản'}: ${formatMoney(num(data.totalAssets))}`,
    `${isEn ? 'Wallet' : 'Ví SmartSpend'}: ${formatMoney(num(data.walletBalance))} (${clampShare(num(data.walletBalancePercent)).toFixed(0)}%)`,
    `${isEn ? 'Cash notebook' : 'Sổ tay tiền mặt'}: ${formatMoney(num(data.cashBalance))} (${clampShare(num(data.cashBalancePercent)).toFixed(0)}%)`,
    '',
    isEn ? 'This period' : 'Kỳ hiện tại',
    `${isEn ? 'Income' : 'Thu'}: ${formatMoney(num(data.current.totalIncome))}`,
    `${isEn ? 'Expense' : 'Chi'}: ${formatMoney(num(data.current.totalExpense))}`,
    `${isEn ? 'Net' : 'Ròng'}: ${formatMoney(num(data.current.net))}`,
    `  ${isEn ? 'Wallet in/out' : 'Ví thu/chi'}: ${formatMoney(num(data.current.wallet.income))} / ${formatMoney(num(data.current.wallet.expense))}`,
    `  ${isEn ? 'Cash in/out' : 'Tiền mặt thu/chi'}: ${formatMoney(num(data.current.cash.income))} / ${formatMoney(num(data.current.cash.expense))}`,
    '',
    isEn ? 'Compared period' : 'Kỳ so sánh',
    `${isEn ? 'Income' : 'Thu'}: ${formatMoney(num(data.compare.totalIncome))}`,
    `${isEn ? 'Expense' : 'Chi'}: ${formatMoney(num(data.compare.totalExpense))}`,
    `${isEn ? 'Net' : 'Ròng'}: ${formatMoney(num(data.compare.net))}`,
    '',
    isEn ? 'Change' : 'Chênh lệch',
    `${isEn ? 'Income' : 'Thu'}: ${formatMoney(num(data.delta.totalIncome.amount))} (${formatDeltaPercent(data.delta.totalIncome.percent, isEn)})`,
    `${isEn ? 'Expense' : 'Chi'}: ${formatMoney(num(data.delta.totalExpense.amount))} (${formatDeltaPercent(data.delta.totalExpense.percent, isEn)})`,
    `${isEn ? 'Net' : 'Ròng'}: ${formatMoney(num(data.delta.net.amount))} (${formatDeltaPercent(data.delta.net.percent, isEn)})`,
  ]
  if (insights.length) {
    lines.push('', isEn ? 'Summary' : 'Tóm tắt', ...insights.map((line) => `- ${line}`))
  }
  return lines.join('\n')
}
