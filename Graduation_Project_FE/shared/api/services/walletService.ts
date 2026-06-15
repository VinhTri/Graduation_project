import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';

export interface WalletData {
  id: number;
  name: string;
  balance: number;
  isDefault: boolean;
}

export const walletService = {
  getMyWallet: async (): Promise<WalletData> => {
    const response = await axiosClient.get(ENDPOINTS.WALLET.MY_WALLET);
    return response.data;
  }
};
