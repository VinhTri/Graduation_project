export type NotebookBookType = 'CASH'

export type NotebookTransactionType = 'EXPENSE' | 'INCOME'

export type NotebookPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'

export type NotebookBookResponse = {
  id: number
  name: string
  balance: number
  bookType: NotebookBookType
}

export type NotebookTransactionResponse = {
  transactionCode: string
  bookId: number
  amount: number
  type: NotebookTransactionType
  note: string | null
  categoryId: number | null
  categoryName: string | null
  categoryIcon?: string | null
  categoryColor?: string | null
  categoryBgColor?: string | null
  categoryDeleted?: boolean
  createdAt: string
}

export type NotebookTransactionRequest = {
  amount: number
  type: NotebookTransactionType
  categoryId: number
  note?: string
  bookId?: number
  /** yyyy-MM-dd — ngày ghi chép (tùy chọn) */
  entryDate?: string
}
