import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export interface SplitMemberItemPayload {
  userId: number;
  amount: number;
}

export interface CreateSplitBillPayload {
  title: string;
  totalAmount: number;
  note?: string;
  members: SplitMemberItemPayload[];
}

export interface SplitBillMemberItem {
  id: number;
  userId: number;
  username: string;
  email: string;
  accountNumber?: string | null;
  avatarUrl?: string | null;
  amount: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string | null;
  transactionCode?: string | null;
  lastRemindedAt?: string | null;
  createdAt: string;
}

export interface SplitBillDetail {
  id: number;
  creatorId: number;
  creatorUsername: string;
  creatorEmail: string;
  creatorAccountNumber?: string | null;
  creatorAvatarUrl?: string | null;
  title: string;
  totalAmount: number;
  note?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string | null;
  members: SplitBillMemberItem[];
  creator: boolean;
  myStatus?: 'PENDING' | 'PAID' | null;
  myAmount?: number | null;
  totalPaidAmount: number;
  totalPendingAmount: number;
  paidMembersCount: number;
  totalMembersCount: number;
}

export const splitBillService = {
  createSplitBill: async (data: CreateSplitBillPayload) => {
    const response: any = await axiosClient.post(ENDPOINTS.SPLIT_BILL.BASE, data);
    return response;
  },

  getMySplitBills: async () => {
    const response: any = await axiosClient.get(ENDPOINTS.SPLIT_BILL.BASE);
    return response;
  },

  getSplitBillDetail: async (id: number) => {
    const response: any = await axiosClient.get(ENDPOINTS.SPLIT_BILL.DETAIL(id));
    return response;
  },

  paySplitBill: async (id: number, data: { pinCode: string; note?: string }) => {
    const response: any = await axiosClient.post(ENDPOINTS.SPLIT_BILL.PAY(id), data);
    return response;
  },

  remindMember: async (id: number, memberUserId: number) => {
    const response: any = await axiosClient.post(ENDPOINTS.SPLIT_BILL.REMIND(id, memberUserId));
    return response;
  },

  cancelSplitBill: async (id: number) => {
    const response: any = await axiosClient.delete(ENDPOINTS.SPLIT_BILL.CANCEL(id));
    return response;
  },
};
