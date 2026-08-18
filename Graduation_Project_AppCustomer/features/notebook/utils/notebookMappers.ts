import type { NotebookTransactionResponse } from '@/shared/types/notebook'
import { formatMoney } from '@/shared/utils/moneyFormat'
import { toSafeAmount } from './amount'

export type NotebookTransactionItem = {
  id: string
  title: string
  subtitle: string
  amount: number
  type: 'EXPENSE' | 'INCOME'
  categoryId: number | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  categoryBgColor: string | null
  categoryDeleted: boolean
  note: string | null
  createdAt: string
  dateLabel: string
}

export function stripDeletedCategorySuffix(name: string | null | undefined) {
  return (name || 'Khác').trim().replace(/\s*\(đã xóa\)\s*$/i, '').trim() || 'Khác'
}

/** Tên danh mục sạch (không gắn "(đã xóa)" — hiển thị riêng bên dưới). */
export function formatCategoryDisplayName(name: string | null | undefined, _deleted?: boolean) {
  return stripDeletedCategorySuffix(name)
}

export function mapNotebookTransaction(item: NotebookTransactionResponse): NotebookTransactionItem {
  const isExpense = item.type === 'EXPENSE'
  return {
    id: item.transactionCode,
    title: isExpense ? 'Chi tiêu' : 'Thu nhập',
    subtitle: formatDateTime(item.createdAt),
    amount: toSafeAmount(item.amount),
    type: item.type,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryIcon: item.categoryIcon ?? null,
    categoryColor: item.categoryColor ?? null,
    categoryBgColor: item.categoryBgColor ?? null,
    categoryDeleted: !!item.categoryDeleted,
    note: item.note,
    createdAt: item.createdAt,
    dateLabel: formatDayLabel(item.createdAt),
  }
}

export function formatDateTime(value: string) {
  const date = parseCreatedAt(value)
  const day = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${day} · ${time}`
}

function formatDayLabel(value: string) {
  const date = parseCreatedAt(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (isSameDay(date, today)) return 'Hôm nay'
  if (isSameDay(date, yesterday)) return 'Hôm qua'

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function parseCreatedAt(raw: string) {
  const match = String(raw || '').match(
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
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatCurrency(value: number) {
  return formatMoney(toSafeAmount(value))
}

