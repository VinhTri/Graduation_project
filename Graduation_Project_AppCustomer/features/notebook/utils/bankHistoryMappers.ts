import type { TransactionHistoryItem } from '@/shared/api/services/transactionService'
import type { NotebookTransactionItem } from './notebookMappers'
import { formatDateTime, formatCategoryDisplayName } from './notebookMappers'
import { toSafeAmount } from './amount'
import {
  getNotebookHistoryRange,
  parseNotebookTxDate,
  type NotebookHistoryDateFilter,
} from '../report/notebookReportUtils'

export function mapBankHistoryToNotebookItem(
  item: TransactionHistoryItem,
): NotebookTransactionItem | null {
  if (item.type !== 'EXPENSE' && item.type !== 'INCOME') return null
  const amount = toSafeAmount(item.amount)
  const isExpense = item.type === 'EXPENSE'
  return {
    id: item.transactionCode,
    title: isExpense ? 'Chi tiêu' : 'Thu nhập',
    subtitle: formatDateTime(item.createdAt),
    amount,
    type: item.type,
    categoryId: item.categoryId ?? null,
    categoryName: item.categoryLabel ?? null,
    categoryIcon: item.categoryIcon ?? null,
    categoryColor: item.categoryColor ?? null,
    categoryBgColor: null,
    categoryDeleted: !!item.categoryDeleted,
    note: item.note ?? null,
    createdAt: item.createdAt,
    dateLabel: formatDateTime(item.createdAt),
  }
}

export function filterNotebookItemsByHistoryRange(
  items: NotebookTransactionItem[],
  filter: NotebookHistoryDateFilter,
  selectedDate: Date,
) {
  const { start, end } = getNotebookHistoryRange(filter, selectedDate)
  return items.filter((tx) => {
    const date = parseNotebookTxDate(tx)
    return date >= start && date <= end
  })
}

export function toInitialTransactionData(tx: NotebookTransactionItem) {
  return {
    transactionCode: tx.id,
    amount: tx.amount,
    note: tx.note,
    categoryId: tx.categoryId,
    categoryName: formatCategoryDisplayName(tx.categoryName, tx.categoryDeleted),
    categoryIcon: tx.categoryIcon,
    categoryColor: tx.categoryColor,
    categoryDeleted: tx.categoryDeleted,
    createdAt: tx.createdAt,
  }
}
