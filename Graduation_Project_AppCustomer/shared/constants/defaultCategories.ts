// Danh mục mặc định (hệ thống) — không cho sửa/xóa.
// Dùng cho luồng quỹ, chia tiền, chuyển tiền nội bộ và fallback icon trên lịch sử ví.

export const FUND_DEPOSIT_CATEGORY_ID = 'sys-fund-deposit';
export const FUND_WITHDRAW_CATEGORY_ID = 'sys-fund-withdraw';
export const SPLIT_EXPENSE_CATEGORY_ID = 'sys-split-expense';
export const SPLIT_INCOME_CATEGORY_ID = 'sys-split-income';
export const TRANSFER_OUT_CATEGORY_ID = 'sys-transfer-out';
export const TRANSFER_IN_CATEGORY_ID = 'sys-transfer-in';

// Luồng dòng tiền cho báo cáo: nạp quỹ tính là Chi tiêu, rút quỹ tính là Thu nhập
export type CategoryFlow = 'EXPENSE' | 'INCOME';

export interface DefaultCategoryItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  isDefault: true;
  flow: CategoryFlow;
  groupId: string;
  groupTitle: string;
}

export interface DefaultCategoryGroup {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  isDefault: true;
  items: DefaultCategoryItem[];
}

// Nạp quỹ = tiền rời khỏi ví người dùng => tính vào Chi tiêu
export const FUND_DEPOSIT_CATEGORY: DefaultCategoryItem = {
  id: FUND_DEPOSIT_CATEGORY_ID,
  label: 'Nạp quỹ',
  icon: 'briefcase-outline',
  color: '#DC2626',
  bgColor: '#FEE2E2',
  isDefault: true,
  flow: 'EXPENSE',
  groupId: 'sys-expense',
  groupTitle: 'Chi tiêu',
};

// Rút quỹ = tiền quay lại ví người dùng => tính vào Thu nhập (chỉ chủ quỹ)
export const FUND_WITHDRAW_CATEGORY: DefaultCategoryItem = {
  id: FUND_WITHDRAW_CATEGORY_ID,
  label: 'Rút quỹ',
  icon: 'wallet-outline',
  color: '#059669',
  bgColor: '#D1FAE5',
  isDefault: true,
  flow: 'INCOME',
  groupId: 'sys-income',
  groupTitle: 'Thu nhập',
};

export const SPLIT_EXPENSE_CATEGORY: DefaultCategoryItem = {
  id: SPLIT_EXPENSE_CATEGORY_ID,
  label: 'Chia tiền',
  icon: 'people-outline',
  color: '#7C3AED',
  bgColor: '#EDE9FE',
  isDefault: true,
  flow: 'EXPENSE',
  groupId: 'sys-expense',
  groupTitle: 'Chi tiêu',
};

export const SPLIT_INCOME_CATEGORY: DefaultCategoryItem = {
  id: SPLIT_INCOME_CATEGORY_ID,
  label: 'Chia tiền',
  icon: 'people-outline',
  color: '#7C3AED',
  bgColor: '#EDE9FE',
  isDefault: true,
  flow: 'INCOME',
  groupId: 'sys-income',
  groupTitle: 'Thu nhập',
};

export const TRANSFER_OUT_CATEGORY: DefaultCategoryItem = {
  id: TRANSFER_OUT_CATEGORY_ID,
  label: 'Chuyển tiền',
  icon: 'swap-horizontal-outline',
  color: '#2563EB',
  bgColor: '#DBEAFE',
  isDefault: true,
  flow: 'EXPENSE',
  groupId: 'sys-expense',
  groupTitle: 'Chi tiêu',
};

export const TRANSFER_IN_CATEGORY: DefaultCategoryItem = {
  id: TRANSFER_IN_CATEGORY_ID,
  label: 'Nhận chuyển tiền',
  icon: 'swap-horizontal-outline',
  color: '#059669',
  bgColor: '#D1FAE5',
  isDefault: true,
  flow: 'INCOME',
  groupId: 'sys-income',
  groupTitle: 'Thu nhập',
};

export const DEFAULT_CATEGORY_GROUPS: DefaultCategoryGroup[] = [
  {
    id: 'sys-expense',
    title: 'Chi tiêu',
    icon: 'trending-down-outline',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    isDefault: true,
    items: [FUND_DEPOSIT_CATEGORY, SPLIT_EXPENSE_CATEGORY, TRANSFER_OUT_CATEGORY],
  },
  {
    id: 'sys-income',
    title: 'Thu nhập',
    icon: 'trending-up-outline',
    color: '#059669',
    bgColor: '#D1FAE5',
    isDefault: true,
    items: [FUND_WITHDRAW_CATEGORY, SPLIT_INCOME_CATEGORY, TRANSFER_IN_CATEGORY],
  },
];

export function resolveSystemWalletCategory(name?: string | null, flow?: CategoryFlow) {
  const label = (name ?? '').replace(/\s*\(đã xóa\)\s*$/i, '').trim()
  if (label === 'Nạp quỹ') return FUND_DEPOSIT_CATEGORY
  if (label === 'Rút quỹ') return FUND_WITHDRAW_CATEGORY
  if (label === 'Chia tiền') {
    return flow === 'INCOME' ? SPLIT_INCOME_CATEGORY : SPLIT_EXPENSE_CATEGORY
  }
  if (label === 'Chuyển tiền') return TRANSFER_OUT_CATEGORY
  if (label === 'Nhận chuyển tiền') return TRANSFER_IN_CATEGORY
  return null
}
