import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';
import {
  Fund,
  FundMember,
  FundTransaction,
  FundTransactionType,
} from '../../../features/funds/types';
import {
  FUND_DEPOSIT_CATEGORY,
  FUND_WITHDRAW_CATEGORY,
} from '../../constants/defaultCategories';

export interface FundSummaryDto {
  id: number;
  name: string;
  balance: number;
  targetAmount?: number;
  coverColorSeed: number;
  isOwner: boolean;
  memberCount: number;
}

export interface FundMemberDto {
  id: number;
  userId?: number;
  name: string;
  avatarUrl?: string;
  role: 'OWNER' | 'MEMBER';
  status: 'INVITED' | 'ACTIVE' | 'LEFT';
  contributedAmount: number;
}

export interface FundTransactionDto {
  id: number;
  userId: number;
  userName: string;
  avatarUrl?: string;
  amount: number;
  type: FundTransactionType;
  note?: string;
  createdAt: string;
  memberLeft?: boolean;
}

export interface FundDetailDto extends FundSummaryDto {
  members: FundMemberDto[];
  transactions: FundTransactionDto[];
}

export interface CreateFundPayload {
  name: string;
  targetAmount: number;
  coverColorSeed: number;
}

export interface FundAmountPayload {
  amount: number;
  note?: string;
  pinCode: string;
}

const toCategory = (type: FundTransactionType) => {
  const src = type === 'WITHDRAW' ? FUND_WITHDRAW_CATEGORY : FUND_DEPOSIT_CATEGORY;
  return {
    id: src.id,
    label: src.label,
    icon: src.icon,
    color: src.color,
    bgColor: src.bgColor,
    flow: src.flow,
    groupTitle: src.groupTitle,
  };
};

const mapMember = (m: FundMemberDto): FundMember => ({
  id: m.id,
  userId: m.userId,
  name: m.name,
  avatarUrl: m.avatarUrl,
  role: m.role,
  status: m.status,
  contributedAmount: Number(m.contributedAmount) || 0,
});

const mapTx = (t: FundTransactionDto): FundTransaction => ({
  id: t.id,
  userId: t.userId,
  userName: t.userName,
  avatarUrl: t.avatarUrl,
  amount: Number(t.amount) || 0,
  type: t.type,
  category: toCategory(t.type),
  note: t.note,
  createdAt: typeof t.createdAt === 'string' ? t.createdAt : String(t.createdAt),
  memberLeft: !!t.memberLeft,
});

const mapSummary = (f: FundSummaryDto): Fund => ({
  id: f.id,
  name: f.name,
  balance: Number(f.balance) || 0,
  targetAmount: f.targetAmount != null ? Number(f.targetAmount) : undefined,
  coverColorSeed: f.coverColorSeed,
  isOwner: !!f.isOwner,
  memberCount: Number(f.memberCount) || 0,
  members: [],
  transactions: [],
});

const mapDetail = (f: FundDetailDto): Fund => ({
  ...mapSummary(f),
  members: (f.members || []).map(mapMember),
  transactions: (f.transactions || []).map(mapTx),
});

export const fundService = {
  listMyFunds: async (): Promise<Fund[]> => {
    const response = await axiosClient.get(ENDPOINTS.FUND.LIST);
    const list = (response.data || []) as FundSummaryDto[];
    return list.map(mapSummary);
  },

  getFundDetail: async (id: number): Promise<Fund> => {
    const response = await axiosClient.get(ENDPOINTS.FUND.DETAIL(id));
    return mapDetail(response.data as FundDetailDto);
  },

  createFund: async (payload: CreateFundPayload): Promise<Fund> => {
    const response = await axiosClient.post(ENDPOINTS.FUND.CREATE, payload);
    return mapDetail(response.data as FundDetailDto);
  },

  deleteFund: async (id: number): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.FUND.DELETE(id));
  },

  deposit: async (id: number, payload: FundAmountPayload): Promise<Fund> => {
    const response = await axiosClient.post(ENDPOINTS.FUND.DEPOSIT(id), payload);
    return mapDetail(response.data as FundDetailDto);
  },

  withdraw: async (id: number, payload: FundAmountPayload): Promise<Fund> => {
    const response = await axiosClient.post(ENDPOINTS.FUND.WITHDRAW(id), payload);
    return mapDetail(response.data as FundDetailDto);
  },

  updateTransactionNote: async (
    fundId: number,
    txId: number,
    note: string
  ): Promise<FundTransaction> => {
    const response = await axiosClient.put(ENDPOINTS.FUND.UPDATE_NOTE(fundId, txId), { note });
    return mapTx(response.data as FundTransactionDto);
  },

  inviteMember: async (fundId: number, userId: number): Promise<Fund> => {
    const response = await axiosClient.post(ENDPOINTS.FUND.INVITE(fundId), { userId });
    return mapDetail(response.data as FundDetailDto);
  },

  acceptInvite: async (fundId: number): Promise<Fund> => {
    const response = await axiosClient.post(ENDPOINTS.FUND.ACCEPT_INVITE(fundId));
    return mapDetail(response.data as FundDetailDto);
  },

  rejectInvite: async (fundId: number): Promise<void> => {
    await axiosClient.post(ENDPOINTS.FUND.REJECT_INVITE(fundId));
  },

  leaveFund: async (fundId: number): Promise<void> => {
    await axiosClient.post(ENDPOINTS.FUND.LEAVE(fundId));
  },
};
