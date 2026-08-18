import type { BudgetStatus } from '@/shared/types/budget'

export const BUDGET_STATUS_META: Record<
  BudgetStatus,
  { label: string; tabLabel: string; bg: string; color: string }
> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    tabLabel: 'Hoạt động',
    bg: '#D1FAE5',
    color: '#059669',
  },
  UPCOMING: {
    label: 'Chưa đến ngày bắt đầu',
    tabLabel: 'Chưa bắt đầu',
    bg: '#FEF3C7',
    color: '#D97706',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    tabLabel: 'Hoàn thành',
    bg: '#E5E7EB',
    color: '#4B5563',
  },
  INVALIDATED: {
    label: 'Hết hiệu lực',
    tabLabel: 'Hết hiệu lực',
    bg: '#FEE2E2',
    color: '#DC2626',
  },
}

/** Thứ tự tab vuốt (không có "Tất cả"). */
export const BUDGET_STATUS_TABS: BudgetStatus[] = [
  'ACTIVE',
  'UPCOMING',
  'COMPLETED',
  'INVALIDATED',
]

export function budgetStatusLabel(status: BudgetStatus): string {
  return BUDGET_STATUS_META[status]?.label ?? status
}
