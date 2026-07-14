export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  categoryIcon: string;
  categoryColor: string;
}

export interface RecentTransactionsProps {
  transactions: TransactionItem[];
}
