import { axiosClient } from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface BudgetCreateRequest {
  name: string;
  categoryId: number;
  walletId?: number;
  amount: number;
  cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export interface BudgetUpdateRequest {
  name: string;
  amount: number;
}

export interface BudgetSummaryResponse {
  totalLimit: number;
  totalSpent: number;
  remaining: number;
  warningCount: number;
}

export interface BudgetResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  categoryBgColor: string;
  walletId?: number;
  walletName?: string;
  amount: number;
  spentAmount: number;
  cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  isNotified80: boolean;
  isNotified100: boolean;
}

export const budgetApi = {
  getBudgets: async (): Promise<BudgetResponse[]> => {
    const response: any = await axiosClient.get(ENDPOINTS.BUDGET.BASE);
    return response?.data ?? response ?? [];
  },

  getBudgetById: async (id: number): Promise<BudgetResponse> => {
    const response: any = await axiosClient.get(ENDPOINTS.BUDGET.DETAIL(id));
    return response?.data ?? response;
  },

  getBudgetSummary: async (): Promise<BudgetSummaryResponse> => {
    const response: any = await axiosClient.get(ENDPOINTS.BUDGET.SUMMARY);
    return response?.data ?? response;
  },

  createBudget: async (data: BudgetCreateRequest): Promise<BudgetResponse> => {
    const response: any = await axiosClient.post(ENDPOINTS.BUDGET.BASE, data);
    return response?.data ?? response;
  },

  updateBudget: async (id: number, data: BudgetUpdateRequest): Promise<BudgetResponse> => {
    const response: any = await axiosClient.put(ENDPOINTS.BUDGET.DETAIL(id), data);
    return response?.data ?? response;
  },

  cheatSpent: async (id: number, spentAmount: number): Promise<BudgetResponse> => {
    const response: any = await axiosClient.post(`${ENDPOINTS.BUDGET.DETAIL(id)}/cheat-spent`, { spentAmount });
    return response?.data ?? response;
  },

  deleteBudget: async (id: number): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.BUDGET.DETAIL(id));
  },
};
