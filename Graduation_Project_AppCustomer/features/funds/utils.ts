import { formatAmount, formatMoney } from '@/shared/utils/moneyFormat'

export const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return formatAmount(0)
  return formatAmount(value)
}

export const formatCurrencyWithSymbol = (value: number): string => formatMoney(value)

// Rút gọn số lớn: 1.500.000 -> 1.5tr
export const formatCompactCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')} tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return formatCurrency(value);
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const parseAmountInput = (text: string): string => text.replace(/[^0-9]/g, '');
