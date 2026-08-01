export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  /** Nhãn hiển thị (Hôm nay / Hôm qua / dd/MM) */
  date: string;
  /** ISO timestamp để lọc báo cáo theo kỳ */
  createdAt?: string;
  type: 'INCOME' | 'EXPENSE';
  note?: string;
  categoryId?: string | number;
  categoryLabel?: string;
  categoryIcon: string;
  categoryColor: string;
}

export interface RecentTransactionsProps {
  transactions: TransactionItem[];
  listTitle?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onPressItem?: (item: TransactionItem) => void;
  onDeleteItem?: (item: TransactionItem) => void;
}
