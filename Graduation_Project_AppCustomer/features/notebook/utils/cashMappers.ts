import { TransactionHistoryItem } from '@/shared/api/services/transactionService';
import { TransactionItem } from '../components/RecentTransactions/RecentTransactions.types';

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfWeek = (d: Date) => {
  const start = startOfDay(d);
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setDate(start.getDate() - day);
  return start;
};

export const formatCashDisplayDate = (iso: string): string => {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return 'Khác';

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const day = startOfDay(created);

  if (day.getTime() === today.getTime()) return 'Hôm nay';
  if (day.getTime() === yesterday.getTime()) return 'Hôm qua';
  return `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
};

export const mapCashHistoryToItem = (tx: TransactionHistoryItem): TransactionItem | null => {
  const type = String(tx.type || '').toUpperCase();
  if (type !== 'EXPENSE' && type !== 'INCOME') return null;

  const categoryLabel =
    tx.categoryLabel || (type === 'INCOME' ? 'Thu tiền mặt' : 'Chi tiền mặt');
  const note = tx.note?.trim() || undefined;

  return {
    id: tx.transactionCode,
    title: categoryLabel,
    amount: Number(tx.amount) || 0,
    date: formatCashDisplayDate(tx.createdAt),
    createdAt: tx.createdAt,
    type: type as 'INCOME' | 'EXPENSE',
    note,
    categoryId: tx.categoryId,
    categoryLabel,
    categoryIcon: tx.categoryIcon || 'cash-outline',
    categoryColor: tx.categoryColor || (type === 'INCOME' ? '#059669' : '#EF4444'),
  };
};

export const filterCashTransactions = (
  transactions: TransactionItem[],
  filter: 'week' | 'month' | 'year',
  selectedDate: Date
): TransactionItem[] => {
  const d = new Date(selectedDate);
  let start: Date;
  let end: Date;

  if (filter === 'week') {
    start = startOfWeek(d);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'year') {
    start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return transactions.filter((t) => {
    if (!t.createdAt) return true;
    const txDate = new Date(t.createdAt);
    return txDate >= start && txDate <= end;
  });
};
