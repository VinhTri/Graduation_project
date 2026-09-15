import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';

export interface TopUpRequest {
  walletId?: number;
  amount?: number;
}

export interface TopUpResponse {
  transactionCode: string;
  transferContent?: string;
  qrUrl?: string;
  expiresAt?: string;
  amount?: number;
  createdAt: string;
}


export interface TransferRequest {
  receiverAccountNumber: string;
  amount: number;
  pinCode: string;
  note?: string;
}

export interface TransferResponse {
  transactionCode: string;
  status: string;
  amount: number;
  receiverName: string;
  createdAt: string;
}

export interface WithdrawRequest {
  amount: number;
  bankAccountId: number;
  pinCode: string;
  note?: string;
}

export interface WithdrawResponse {
  transactionCode: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  createdAt: string;
}

export interface TransactionHistoryItem {
  transactionCode: string;
  type: string;
  status: string;
  amount: number;
  note?: string;
  categoryId?: number;
  categoryLabel?: string;
  categoryIcon?: string;
  categoryColor?: string;
  categoryDeleted?: boolean;
  createdAt: string;
}

export const transactionService = {
  initiateTopUp: async (data: TopUpRequest): Promise<TopUpResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.TOP_UP, data);
    return response.data;
  },

  
  internalTransfer: async (data: TransferRequest): Promise<TransferResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.TRANSFER, data);
    return response.data;
  },

  processWithdrawal: async (data: WithdrawRequest): Promise<WithdrawResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.WITHDRAW, data);
    return response.data;
  },

  getTransactionHistory: async (wallet: 'main' | string = 'main'): Promise<TransactionHistoryItem[]> => {
    const response = await axiosClient.get(ENDPOINTS.HISTORY.TRANSACTIONS, {
      params: { wallet },
    });
    return response.data || [];
  },

  updateTransaction: async (code: string, data: { categoryId?: number; note?: string }): Promise<any> => {
    const response = await axiosClient.put(`/api/v1/transactions/${code}`, data);
    return response.data;
  },
};
