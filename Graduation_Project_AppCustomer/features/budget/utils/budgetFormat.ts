import { formatAmount, formatMoney as formatMoneyShared } from '@/shared/utils/moneyFormat'

export function toSafeAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

export function formatMoney(value: unknown): string {
  return formatMoneyShared(Math.round(toSafeAmount(value)))
}

export function parseAmountInput(text: string): number {
  const digits = text.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

export function formatAmountInput(text: string): string {
  const digits = text.replace(/[^\d]/g, '').slice(0, 12)
  if (!digits) return ''
  return formatAmount(Number(digits))
}

/** yyyy-MM-dd */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 00:00 hôm nay — dùng làm mốc không cho chọn quá khứ. */
export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function clampToTodayOrLater(date: Date): Date {
  const today = startOfToday()
  return date < today ? today : date
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatDisplayDate(iso: string): string {
  const date = parseIsoDate(iso)
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Kỳ tuần gồm đúng 7 ngày, tính cả ngày bắt đầu và ngày kết thúc. */
export function weekEndFromStart(start: Date): Date {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

export function progressRatio(spent: unknown, limit: unknown): number {
  const lim = toSafeAmount(limit)
  if (lim <= 0) return 0
  return Math.min(toSafeAmount(spent) / lim, 1.2)
}
