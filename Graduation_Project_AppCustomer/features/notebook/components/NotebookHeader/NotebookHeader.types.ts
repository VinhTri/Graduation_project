export interface NotebookHeaderProps {
  topTab: 'cash' | 'bank';
  setTopTab: (tab: 'cash' | 'bank') => void;
  totalBalance: number;
  onAddCashBalance?: () => void;
  onSpendCashBalance?: () => void;
}
