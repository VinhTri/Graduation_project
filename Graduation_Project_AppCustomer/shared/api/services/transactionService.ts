import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';

export interface TopUpRequest {
  amount?: number;
  note?: string;
  categoryId?: number;
}

export interface TopUpResponse {
  transferContent: string;
  qrUrl: string;
  expiresAt: string;
  amount?: number;
  createdAt: string;
}


export interface TransferRequest {
  receiverAccountNumber: string;
  amount: number;
  pinCode: string;
  note?: string;
  categoryId?: number;
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
  categoryId?: number;
}

export interface WithdrawResponse {
  transactionCode: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  createdAt: string;
}

export interface ManualTransactionRequest {
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId: number;
  note?: string;
  walletId?: number;
}

export interface ManualTransactionResponse {
  transactionCode: string;
  type: 'EXPENSE' | 'INCOME';
  status: string;
  amount: number;
  categoryId: number;
  note?: string;
  cashBalance: number;
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

  createManualTransaction: async (
    data: ManualTransactionRequest
  ): Promise<ManualTransactionResponse> => {
    const response = await axiosClient.post(ENDPOINTS.TRANSACTION.MANUAL, data);
    return response.data;
  },

  updateManualTransaction: async (
    transactionCode: string,
    data: ManualTransactionRequest
  ): Promise<ManualTransactionResponse> => {
    const response = await axiosClient.put(ENDPOINTS.TRANSACTION.UPDATE_MANUAL(transactionCode), data);
    return response.data;
  },

  deleteManualTransaction: async (transactionCode: string): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.TRANSACTION.DELETE_MANUAL(transactionCode));
  },

  getTransactionHistory: async (wallet: 'main' | 'cash' = 'main'): Promise<TransactionHistoryItem[]> => {
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
