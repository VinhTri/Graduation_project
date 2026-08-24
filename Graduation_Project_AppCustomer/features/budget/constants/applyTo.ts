import type { BudgetApplyTo } from '@/shared/types/budget'

export const BUDGET_APPLY_OPTIONS: {
  value: BudgetApplyTo
  label: string
  hint: string
}[] = [
  {
    value: 'NOTEBOOK',
    label: 'Sổ tay tiền mặt',
    hint: 'Theo chi tiêu sổ tay tiền mặt',
  },
  {
    value: 'WALLET',
    label: 'Ví SmartSpend',
    hint: 'Theo rút tiền ví SmartSpend',
  },
  {
    value: 'BOTH',
    label: 'Cả hai',
    hint: 'Mỗi nguồn đo riêng với cùng hạn mức',
  },
]

export function applyToLabel(applyTo: BudgetApplyTo): string {
  return BUDGET_APPLY_OPTIONS.find((o) => o.value === applyTo)?.label ?? applyTo
}

export const BUDGET_SOURCE_LABEL = {
  notebook: 'Sổ tay tiền mặt',
  wallet: 'Ví SmartSpend',
} as const
