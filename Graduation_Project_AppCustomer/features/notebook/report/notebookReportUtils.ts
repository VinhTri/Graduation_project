import type { NotebookTransactionItem } from '../utils/notebookMappers'
import { toSafeAmount } from '../utils/amount'
import { formatMoney } from '@/shared/utils/moneyFormat'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

/** Bộ lọc kỳ riêng của báo cáo sổ tay (không dùng chung báo cáo ví). */
export type NotebookReportDateFilter = 'week' | 'month' | 'year'
/** Bộ lọc lịch sử sổ tay — có thêm lọc từng ngày. */
export type NotebookHistoryDateFilter = 'day' | 'week' | 'month' | 'year'
export type NotebookReportViewMode = 'pie' | 'group' | 'bar'
export type NotebookReportTab = 'expense' | 'income'

export type NotebookReportDistRow = {
  key: string
  categoryName: string
  icon: string
  color: string
  totalAmount: number
  percentage: number
  deleted?: boolean
}

export type NotebookReportTrendPoint = {
  value: number
  label: string
  /** Nhãn đầy đủ cho banner Chi/Thu (vd: T2 · 03/08). */
  timeLabel: string
  isCurrent?: boolean
}

export type NotebookReportCategoryMeta = {
  key?: string
  icon: string
  color: string
  label: string
  deleted?: boolean
}

export type NotebookDualTrend = {
  labels: string[]
  expense: NotebookReportTrendPoint[]
  income: NotebookReportTrendPoint[]
  maxValue: number
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function formatNotebookReportCurrency(amount: number) {
  return formatMoney(Math.round(amount || 0))
}

/** Chuẩn hoá ngày giao dịch về local calendar (tránh lệch timezone). */
export function parseNotebookTxDate(tx: NotebookTransactionItem): Date {
  const raw = tx.createdAt
  if (!raw) return new Date()

  const match = String(raw).match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  )
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] || 12),
      Number(match[5] || 0),
      Number(match[6] || 0),
    )
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function toLocalDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfWeek(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1
  start.setDate(start.getDate() - day)
  start.setHours(0, 0, 0, 0)
  return start
}

export function isSameWeek(a: Date, b: Date) {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime()
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatDayMonth(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`
}

export function getNotebookReportRange(filter: NotebookReportDateFilter, selected: Date) {
  const d = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
  let start: Date
  let end: Date

  if (filter === 'week') {
    start = startOfWeek(d)
    end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
  } else if (filter === 'year') {
    start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0)
    end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  return { start, end }
}

/** Khoảng lọc lịch sử — giống báo cáo, thêm mode `day`. */
export function getNotebookHistoryRange(filter: NotebookHistoryDateFilter, selected: Date) {
  if (filter === 'day') {
    const start = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
      23,
      59,
      59,
      999,
    )
    return { start, end }
  }
  return getNotebookReportRange(filter, selected)
}

function sumByDayKey(
  txs: NotebookTransactionItem[],
  type: 'EXPENSE' | 'INCOME',
  start: Date,
  end: Date,
) {
  const map = new Map<string, number>()
  txs.forEach((tx) => {
    if (tx.type !== type) return
    const date = parseNotebookTxDate(tx)
    if (date < start || date > end) return
    const key = toLocalDateKey(date)
    map.set(key, (map.get(key) || 0) + toSafeAmount(tx.amount))
  })
  return map
}

function sumByMonthKey(
  txs: NotebookTransactionItem[],
  type: 'EXPENSE' | 'INCOME',
  year: number,
) {
  const map = new Map<number, number>()
  txs.forEach((tx) => {
    if (tx.type !== type) return
    const date = parseNotebookTxDate(tx)
    if (date.getFullYear() !== year) return
    const m = date.getMonth()
    map.set(m, (map.get(m) || 0) + toSafeAmount(tx.amount))
  })
  return map
}

/** Xây 2 chuỗi thu/chi cùng trục — cùng độ dài & nhãn. */
export function buildNotebookDualTrend(
  txs: NotebookTransactionItem[],
  filter: NotebookReportDateFilter,
  selected: Date,
): NotebookDualTrend {
  const { start, end } = getNotebookReportRange(filter, selected)
  const today = new Date()
  const todayKey = toLocalDateKey(today)

  if (filter === 'year') {
    const expenseMap = sumByMonthKey(txs, 'EXPENSE', selected.getFullYear())
    const incomeMap = sumByMonthKey(txs, 'INCOME', selected.getFullYear())
    const labels: string[] = []
    const expense: NotebookReportTrendPoint[] = []
    const income: NotebookReportTrendPoint[] = []
    let maxValue = 0

    for (let m = 0; m < 12; m++) {
      const e = expenseMap.get(m) || 0
      const i = incomeMap.get(m) || 0
      maxValue = Math.max(maxValue, e, i)
      const label = `T${m + 1}`
      const timeLabel = `Tháng ${m + 1}/${selected.getFullYear()}`
      labels.push(label)
      const isCurrent =
        m === today.getMonth() && selected.getFullYear() === today.getFullYear()
      expense.push({ value: e, label, timeLabel, isCurrent })
      income.push({ value: i, label, timeLabel, isCurrent })
    }

    return { labels, expense, income, maxValue }
  }

  const expenseMap = sumByDayKey(txs, 'EXPENSE', start, end)
  const incomeMap = sumByDayKey(txs, 'INCOME', start, end)
  const labels: string[] = []
  const expense: NotebookReportTrendPoint[] = []
  const income: NotebookReportTrendPoint[] = []
  let maxValue = 0

  if (filter === 'week') {
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      const key = toLocalDateKey(day)
      const e = expenseMap.get(key) || 0
      const inc = incomeMap.get(key) || 0
      maxValue = Math.max(maxValue, e, inc)
      const label = WEEKDAY_LABELS[i]
      const timeLabel = `${label} · ${formatDayMonth(day)}`
      labels.push(label)
      expense.push({ value: e, label, timeLabel, isCurrent: key === todayKey })
      income.push({ value: inc, label, timeLabel, isCurrent: key === todayKey })
    }
  } else {
    const daysInMonth = end.getDate()
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(selected.getFullYear(), selected.getMonth(), dayNum)
      const key = toLocalDateKey(date)
      const e = expenseMap.get(key) || 0
      const inc = incomeMap.get(key) || 0
      maxValue = Math.max(maxValue, e, inc)
      const showLabel = dayNum === 1 || dayNum % 5 === 0 || dayNum === daysInMonth
      const label = showLabel ? String(dayNum) : ''
      const timeLabel = `Ngày ${dayNum} · ${formatDayMonth(date)}`
      labels.push(label)
      expense.push({ value: e, label, timeLabel, isCurrent: key === todayKey })
      income.push({ value: inc, label, timeLabel, isCurrent: key === todayKey })
    }
  }

  return { labels, expense, income, maxValue }
}

export function buildNotebookDistribution(
  txs: NotebookTransactionItem[],
  type: 'EXPENSE' | 'INCOME',
  resolveMeta: (tx: NotebookTransactionItem) => NotebookReportCategoryMeta,
): NotebookReportDistRow[] {
  const map = new Map<string, Omit<NotebookReportDistRow, 'percentage'>>()
  let total = 0

  txs.forEach((tx) => {
    if (tx.type !== type) return
    const amount = toSafeAmount(tx.amount)
    total += amount
    const meta = resolveMeta(tx)
    const key = meta.key || String(tx.categoryId ?? `${meta.icon}|${meta.color}|${meta.label}`)
    const prev = map.get(key)
    if (prev) {
      prev.totalAmount += amount
    } else {
      map.set(key, {
        key,
        categoryName: meta.label,
        icon: meta.icon,
        color: meta.color || PASTEL_PALETTE.accentDeep,
        totalAmount: amount,
        deleted: !!meta.deleted,
      })
    }
  })

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      percentage: total > 0 ? (row.totalAmount / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}
