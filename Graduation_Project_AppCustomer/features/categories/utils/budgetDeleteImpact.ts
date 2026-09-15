/** Helpers for category delete confirm when budgets exist. */

import type { BudgetResponse } from '@/shared/types/budget'

const LIVE_STATUSES = new Set(['ACTIVE', 'UPCOMING'])

export function budgetsImpactedByCategory(
  budgets: BudgetResponse[],
  categoryId: number,
): BudgetResponse[] {
  return budgets.filter(
    (b) => b.categoryId === categoryId && LIVE_STATUSES.has(b.status),
  )
}

export function budgetsImpactedByCategories(
  budgets: BudgetResponse[],
  categoryIds: number[],
): BudgetResponse[] {
  const idSet = new Set(categoryIds)
  return budgets.filter(
    (b) => idSet.has(b.categoryId) && LIVE_STATUSES.has(b.status),
  )
}

export function uniqueCategoryLabels(budgets: BudgetResponse[]): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const b of budgets) {
    if (!seen.has(b.categoryName)) {
      seen.add(b.categoryName)
      labels.push(b.categoryName)
    }
  }
  return labels
}

export function buildItemDeleteMessage(label: string, hasLiveBudget: boolean): string {
  if (!hasLiveBudget) {
    return `Xóa danh mục "${label}"? Giao dịch cũ vẫn giữ tên danh mục đã ghi.`
  }
  return (
    `Nếu xóa danh mục "${label}" thì ngân sách đang hoạt động / chưa bắt đầu sẽ ngừng hoạt động và chuyển sang Hết hiệu lực. ` +
    `Ngân sách đã hoàn thành vẫn giữ, kèm ghi chú danh mục đã xóa. Icon và số tiền vẫn được lưu.`
  )
}

export function buildGroupDeleteMessage(
  groupTitle: string,
  itemCount: number,
  impactedLabels: string[],
): string {
  if (impactedLabels.length === 0) {
    return `Xóa nhóm "${groupTitle}" và ${itemCount} danh mục con?`
  }
  const names = impactedLabels.join(', ')
  return (
    `Nhóm "${groupTitle}" chứa ${impactedLabels.length} danh mục đã thiết lập ngân sách: ${names}. ` +
    `Nếu xóa, các ngân sách đang hoạt động / chưa bắt đầu sẽ chuyển sang Hết hiệu lực; ngân sách đã hoàn thành vẫn giữ kèm ghi chú danh mục đã xóa.`
  )
}
