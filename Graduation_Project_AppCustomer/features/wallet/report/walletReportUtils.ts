/**
 * Báo cáo ví SmartSpend — tách riêng khỏi báo cáo sổ tay tiền mặt.
 * Không import module notebook/report.
 */
import { formatMoney } from '@/shared/utils/moneyFormat'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { WalletTransactionResponse, WalletTransactionType } from '@/shared/types/wallet'
import { toSafeAmount } from './amount'

export type WalletReportDateFilter = 'week' | 'month' | 'year'
/** Bộ lọc lịch sử ví — giống sổ tay (có thêm day). */
export type WalletHistoryDateFilter = 'day' | 'week' | 'month' | 'year'
export type WalletReportViewMode = 'pie' | 'bar'
/** Rút tiền ≈ chi; Nạp tiền ≈ thu */
export type WalletReportTab = 'withdraw' | 'topup'

export type WalletReportTx = {
  transactionCode: string
  amount: number
  type: WalletTransactionType
  note: string | null
  categoryId: number | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  categoryBgColor: string | null
  categoryDeleted: boolean
  createdAt: string
}

export type WalletReportDistRow = {
  key: string
  categoryName: string
  icon: string
  color: string
  totalAmount: number
  percentage: number
  deleted?: boolean
}

export type WalletReportTrendPoint = {
  value: number
  label: string
  timeLabel: string
  isCurrent?: boolean
}

export type WalletReportCategoryMeta = {
  icon: string
  color: string
  label: string
  deleted?: boolean
}

export type WalletDualTrend = {
  labels: string[]
  withdraw: WalletReportTrendPoint[]
  topup: WalletReportTrendPoint[]
  maxValue: number
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function mapWalletReportTransaction(item: WalletTransactionResponse): WalletReportTx {
  return {
    transactionCode: item.transactionCode,
    amount: toSafeAmount(item.amount),
    type: item.type,
    note: item.note,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryIcon: item.categoryIcon,
    categoryColor: item.categoryColor,
    categoryBgColor: item.categoryBgColor,
    categoryDeleted: item.categoryDeleted,
    createdAt: item.createdAt,
  }
}

export function formatWalletReportCurrency(amount: number) {
  return formatMoney(Math.round(amount || 0))
}

export function stripDeletedCategorySuffix(name: string | null | undefined) {
  if (!name) return 'Khác'
  return name.replace(/\s*\(đã xóa\)\s*$/i, '').trim() || 'Khác'
}

export function parseWalletTxDate(tx: WalletReportTx): Date {
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

export function getWalletReportRange(filter: WalletReportDateFilter, selected: Date) {
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

/** Khoảng lọc lịch sử ví — giống sổ tay, thêm mode `day`. */
export function getWalletHistoryRange(filter: WalletHistoryDateFilter, selected: Date) {
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
  return getWalletReportRange(filter, selected)
}

function sumByDayKey(
  txs: WalletReportTx[],
  type: WalletTransactionType,
  start: Date,
  end: Date,
) {
  const map = new Map<string, number>()
  txs.forEach((tx) => {
    if (tx.type !== type) return
    const date = parseWalletTxDate(tx)
    if (date < start || date > end) return
    const key = toLocalDateKey(date)
    map.set(key, (map.get(key) || 0) + toSafeAmount(tx.amount))
  })
  return map
}

function sumByMonthKey(txs: WalletReportTx[], type: WalletTransactionType, year: number) {
  const map = new Map<number, number>()
  txs.forEach((tx) => {
    if (tx.type !== type) return
    const date = parseWalletTxDate(tx)
    if (date.getFullYear() !== year) return
    const m = date.getMonth()
    map.set(m, (map.get(m) || 0) + toSafeAmount(tx.amount))
  })
  return map
}

export function buildWalletDualTrend(
  txs: WalletReportTx[],
  filter: WalletReportDateFilter,
  selected: Date,
): WalletDualTrend {
  const { start, end } = getWalletReportRange(filter, selected)
  const today = new Date()
  const todayKey = toLocalDateKey(today)

  if (filter === 'year') {
    const withdrawMap = sumByMonthKey(txs, 'WITHDRAW', selected.getFullYear())
    const topupMap = sumByMonthKey(txs, 'TOP_UP', selected.getFullYear())
    const labels: string[] = []
    const withdraw: WalletReportTrendPoint[] = []
    const topup: WalletReportTrendPoint[] = []
    let maxValue = 0

    for (let m = 0; m < 12; m++) {
      const w = withdrawMap.get(m) || 0
      const t = topupMap.get(m) || 0
      maxValue = Math.max(maxValue, w, t)
      const label = `T${m + 1}`
      const timeLabel = `Tháng ${m + 1}/${selected.getFullYear()}`
      labels.push(label)
      const isCurrent =
        m === today.getMonth() && selected.getFullYear() === today.getFullYear()
      withdraw.push({ value: w, label, timeLabel, isCurrent })
      topup.push({ value: t, label, timeLabel, isCurrent })
    }

    return { labels, withdraw, topup, maxValue }
  }

  const withdrawMap = sumByDayKey(txs, 'WITHDRAW', start, end)
  const topupMap = sumByDayKey(txs, 'TOP_UP', start, end)
  const labels: string[] = []
  const withdraw: WalletReportTrendPoint[] = []
  const topup: WalletReportTrendPoint[] = []
  let maxValue = 0

  if (filter === 'week') {
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      const key = toLocalDateKey(day)
      const w = withdrawMap.get(key) || 0
      const t = topupMap.get(key) || 0
      maxValue = Math.max(maxValue, w, t)
      const label = WEEKDAY_LABELS[i]
      const timeLabel = `${label} · ${formatDayMonth(day)}`
      labels.push(label)
      withdraw.push({ value: w, label, timeLabel, isCurrent: key === todayKey })
      topup.push({ value: t, label, timeLabel, isCurrent: key === todayKey })
    }
  } else {
    const daysInMonth = end.getDate()
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const date = new Date(selected.getFullYear(), selected.getMonth(), dayNum)
      const key = toLocalDateKey(date)
      const w = withdrawMap.get(key) || 0
      const t = topupMap.get(key) || 0
      maxValue = Math.max(maxValue, w, t)
      const showLabel = dayNum === 1 || dayNum % 5 === 0 || dayNum === daysInMonth
      const label = showLabel ? String(dayNum) : ''
      const timeLabel = `Ngày ${dayNum} · ${formatDayMonth(date)}`
      labels.push(label)
      withdraw.push({ value: w, label, timeLabel, isCurrent: key === todayKey })
      topup.push({ value: t, label, timeLabel, isCurrent: key === todayKey })
    }
  }

  return { labels, withdraw, topup, maxValue }
}

export function buildWalletDistribution(
  txs: WalletReportTx[],
  type: WalletTransactionType,
  resolveMeta: (tx: WalletReportTx) => WalletReportCategoryMeta,
): WalletReportDistRow[] {
  const map = new Map<string, Omit<WalletReportDistRow, 'percentage'>>()
  let total = 0

  txs.forEach((tx) => {
    if (tx.type !== type) return
    const amount = toSafeAmount(tx.amount)
    total += amount
    const meta = resolveMeta(tx)
    const key = String(tx.categoryId ?? `${meta.icon}|${meta.color}|${meta.label}`)
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
