export interface NotebookItem {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
}

export interface NotebookListProps {
  notebooks: NotebookItem[];
}
