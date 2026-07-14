import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';

export interface TopUpRequest {
  amount: number;
  note?: string;
  categoryId?: number;
}

export interface TopUpResponse {
  transactionCode: string;
  qrUrl: string;
  expiresAt: string;
  amount: number;
  createdAt: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccountId: number;
  pinCode: string;
}

export interface WithdrawResponse {
  transactionCode: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  createdAt: string;
}

export interface TransactionStatusResponse {
  transactionCode: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  type: string;
  amount: number;
  createdAt: string;
}

export const transactionService = {
  initiateTopUp: async (data: TopUpRequest): Promise<TopUpResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.TOP_UP, data);
    return response.data;
  },

  getTransactionStatus: async (transactionCode: string): Promise<TransactionStatusResponse> => {
    const response = await axiosClient.get(ENDPOINTS.TRANSACTION.GET_STATUS(transactionCode));
    return response.data;
  },

  getPendingTopUp: async (): Promise<TopUpResponse | null> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.TRANSACTION.PENDING_TOPUP);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch pending top-up", error);
      return null;
    }
  },

  cancelTransaction: async (transactionCode: string): Promise<void> => {
    await axiosClient.post(ENDPOINTS.TRANSACTION.CANCEL(transactionCode));
  },

  processWithdrawal: async (data: WithdrawRequest): Promise<WithdrawResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.WITHDRAW, data);
    return response.data;
  },

  getTransactionHistory: async (): Promise<any[]> => {
    const response = await axiosClient.get('/api/v1/history/transactions');
    return response.data;
  },

  updateTransaction: async (code: string, data: { categoryId?: number; note?: string }): Promise<any> => {
    const response = await axiosClient.put(`/api/v1/transactions/${code}`, data);
    return response.data;
  }
};
