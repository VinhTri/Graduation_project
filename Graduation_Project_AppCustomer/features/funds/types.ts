export type FundMemberRole = 'OWNER' | 'MEMBER';
export type FundMemberStatus = 'INVITED' | 'ACTIVE' | 'LEFT';
export type FundTransactionType = 'DEPOSIT' | 'WITHDRAW' | 'EXPENSE';

export interface FundMember {
  id: number;
  userId?: number;
  name: string;
  avatarUrl?: string;
  role: FundMemberRole;
  status: FundMemberStatus;
  contributedAmount: number;
}

export type FundCategoryFlow = 'EXPENSE' | 'INCOME';

export interface FundTransactionCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  flow: FundCategoryFlow;
  groupTitle: string;
}

export interface FundTransaction {
  id: number;
  userId?: number;
  userName: string;
  avatarUrl?: string;
  amount: number;
  type: FundTransactionType;
  category: FundTransactionCategory;
  note?: string;
  createdAt: string;
  /** Người thực hiện giao dịch đã rời quỹ */
  memberLeft?: boolean;
}

export interface Fund {
  id: number;
  name: string;
  balance: number;
  targetAmount?: number;
  minDepositAmount?: number;
  coverColorSeed: number;
  isOwner: boolean;
  memberCount: number;
  members: FundMember[];
  transactions: FundTransaction[];
}

export interface FundInvitation {
  id: number;
  fundId: number;
  fundName: string;
  balance: number;
  targetAmount?: number;
  minDepositAmount?: number;
  coverColorSeed: number;
  ownerId: number;
  ownerName: string;
  ownerAvatar?: string;
  memberCount: number;
  invitedAt: string;
}

