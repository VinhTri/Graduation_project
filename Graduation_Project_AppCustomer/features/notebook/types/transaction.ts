export type TransactionMode = 'add' | 'spend'

export type SelectedCategory = {
  id: number
  label: string
  icon: string
  color: string
  bgColor?: string
  deleted?: boolean
}

export type TransactionPayload = {
  amount: number
  note?: string
  category: SelectedCategory
}

export type InitialTransactionData = {
  transactionCode: string
  amount: number
  note?: string | null
  categoryId?: number | null
  categoryName?: string | null
  categoryIcon?: string | null
  categoryColor?: string | null
  categoryDeleted?: boolean
  createdAt?: string | null
}

