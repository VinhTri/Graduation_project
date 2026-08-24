import type { BudgetResponse } from '@/shared/types/budget'

export type CategoryBudgetSummary = {
  /** Có ngân sách còn hiệu lực (không INVALIDATED). */
  hasBudget: boolean
  /** Số ngân sách đang hoạt động (ACTIVE). */
  activeCount: number
  /** Tổng ngân sách chưa hết hiệu lực. */
  totalCount: number
}

export function buildCategoryBudgetMap(
  budgets: BudgetResponse[],
): Map<number, CategoryBudgetSummary> {
  const map = new Map<number, CategoryBudgetSummary>()

  for (const budget of budgets) {
    if (budget.status === 'INVALIDATED') continue

    const current = map.get(budget.categoryId) ?? {
      hasBudget: false,
      activeCount: 0,
      totalCount: 0,
    }
    current.hasBudget = true
    current.totalCount += 1
    if (budget.status === 'ACTIVE') {
      current.activeCount += 1
    }
    map.set(budget.categoryId, current)
  }

  return map
}

export function getCategoryBudgetSummary(
  map: Map<number, CategoryBudgetSummary>,
  categoryId: number,
): CategoryBudgetSummary {
  return (
    map.get(categoryId) ?? {
      hasBudget: false,
      activeCount: 0,
      totalCount: 0,
    }
  )
}
