import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BudgetItem {
  id: string;
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  categoryBgColor: string;
  limit: number;
  spent: number;
  startDate: string;
  endDate: string;
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export const getBudgetStatus = (spent: number, limit: number): BudgetStatus => {
  if (limit <= 0) return 'ok';
  const ratio = spent / limit;
  if (ratio >= 1) return 'exceeded';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
};

type BudgetContextType = {
  budgets: BudgetItem[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addBudget: (budget: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Omit<BudgetItem, 'id'>>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetsByMonth: (month: string) => BudgetItem[];
  isLoading: boolean;
};

const STORAGE_KEY = '@smartspend_budgets';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allBudgets, setAllBudgets] = useState<BudgetItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((b: any) => {
          if (b.month && !b.startDate) {
            const [y, m] = b.month.split('-');
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
            return {
              ...b,
              startDate: `${b.month}-01`,
              endDate: `${b.month}-${String(lastDay).padStart(2, '0')}`,
            };
          }
          return b;
        });
        setAllBudgets(migrated);
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgets = async (budgets: BudgetItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    setAllBudgets(budgets);
  };

  const addBudget = async (budget: Omit<BudgetItem, 'id'>) => {
    const newBudget: BudgetItem = {
      ...budget,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    const updated = [...allBudgets, newBudget];
    await saveBudgets(updated);
  };

  const updateBudget = async (id: string, updates: Partial<Omit<BudgetItem, 'id'>>) => {
    const updated = allBudgets.map(b => b.id === id ? { ...b, ...updates } : b);
    await saveBudgets(updated);
  };

  const deleteBudget = async (id: string) => {
    const updated = allBudgets.filter(b => b.id !== id);
    await saveBudgets(updated);
  };

  const getBudgetsByMonth = useCallback((month: string): BudgetItem[] => {
    const [y, m] = month.split('-');
    const startOfMonth = `${month}-01`;
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    const endOfMonth = `${month}-${String(lastDay).padStart(2, '0')}`;
    
    return allBudgets.filter(b => {
      return b.startDate <= endOfMonth && b.endDate >= startOfMonth;
    });
  }, [allBudgets]);

  const budgets = getBudgetsByMonth(currentMonth);

  return (
    <BudgetContext.Provider value={{
      budgets,
      currentMonth,
      setCurrentMonth,
      addBudget,
      updateBudget,
      deleteBudget,
      getBudgetsByMonth,
      isLoading,
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgetContext = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgetContext must be used within a BudgetProvider');
  }
  return context;
};
