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

  processWithdrawal: async (data: WithdrawRequest): Promise<WithdrawResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.WITHDRAW, data);
    return response.data;
  }
};
