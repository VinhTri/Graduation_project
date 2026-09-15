export type BudgetApplyTo = 'NOTEBOOK' | 'WALLET' | 'BOTH'

export type BudgetStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'INVALIDATED'

export type BudgetSourceSpend = {
  limitAmount: number | string
  spent: number | string
  remaining: number | string
  overLimit: boolean
}

export type BudgetResponse = {
  id: number
  categoryId: number
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  categoryBgColor: string | null
  categoryGroupName: string | null
  applyTo: BudgetApplyTo
  limitAmount: number | string
  startDate: string
  endDate: string
  status: BudgetStatus
  categoryDeleted: boolean
  notebook: BudgetSourceSpend | null
  wallet: BudgetSourceSpend | null
  total?: BudgetSourceSpend | null
  createdAt: string
  updatedAt: string
}

export type CreateBudgetRequest = {
  categoryId: number
  applyTo: BudgetApplyTo
  limitAmount: number
  startDate: string
  endDate: string
}

export type UpdateBudgetRequest = {
  applyTo: BudgetApplyTo
  limitAmount: number
}
