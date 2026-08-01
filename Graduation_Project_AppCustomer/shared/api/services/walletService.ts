import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';

export interface WalletData {
  id: number;
  name: string;
  balance: number;
  accountNumber?: string;
  isDefault: boolean;
  isLimitEnabled?: boolean;
  transactionLimit?: number;
  dailyLimit?: number;
  dailyTransactedAmount?: number;
  walletType?: 'MAIN' | 'CASH' | string;
}

export interface WalletSettingsRequest {
  isLimitEnabled: boolean;
  transactionLimit?: number;
  dailyLimit?: number;
  pinCode: string;
}

export const walletService = {
  getMyWallet: async (): Promise<WalletData> => {
    const response = await axiosClient.get(ENDPOINTS.WALLET.MY_WALLET);
    return response.data;
  },

  getCashWallet: async (): Promise<WalletData> => {
    const response = await axiosClient.get(ENDPOINTS.WALLET.CASH_WALLET);
    return response.data;
  },

  getBankWallets: async (): Promise<WalletData[]> => {
    const response = await axiosClient.get(ENDPOINTS.WALLET.BANK_WALLETS);
    return response.data;
  },

  createManualBank: async (data: { bankName: string; accountNumber?: string }): Promise<WalletData> => {
    const response = await axiosClient.post(ENDPOINTS.WALLET.CREATE_MANUAL_BANK, data);
    return response.data;
  },

  updateWalletSettings: async (id: number, data: WalletSettingsRequest): Promise<void> => {
    await axiosClient.put(ENDPOINTS.WALLET.UPDATE_SETTINGS(id), data);
  },

  deleteManualBank: async (id: number): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.WALLET.DELETE_MANUAL_BANK(id));
  },
};
