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
  updateWalletSettings: async (id: number, data: WalletSettingsRequest): Promise<void> => {
    await axiosClient.put(ENDPOINTS.WALLET.UPDATE_SETTINGS(id), data);
  }
};
