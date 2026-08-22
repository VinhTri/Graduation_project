import { formatAmount, formatCompactAmount, formatMoney } from '@/shared/utils/moneyFormat'

export const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return formatAmount(0)
  return formatAmount(value)
}

export const formatCurrencyWithSymbol = (value: number): string => formatMoney(value)

// Rút gọn số lớn: 1.500.000 -> 1.5tr
export const formatCompactCurrency = (value: number): string => {
  return formatCompactAmount(value);
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const parseAmountInput = (text: string): string => text.replace(/[^0-9]/g, '');

export const createFundRequestId = (): string =>
  `fund-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
