// Danh mục mặc định (hệ thống) — không cho sửa/xóa.
// Dùng cho luồng Nạp/Rút quỹ và hiển thị trong màn Danh mục ở dạng chỉ đọc.

export const FUND_DEPOSIT_CATEGORY_ID = 'sys-fund-deposit';
export const FUND_WITHDRAW_CATEGORY_ID = 'sys-fund-withdraw';

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

export const DEFAULT_CATEGORY_GROUPS: DefaultCategoryGroup[] = [
  {
    id: 'sys-expense',
    title: 'Chi tiêu',
    icon: 'trending-down-outline',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    isDefault: true,
    items: [FUND_DEPOSIT_CATEGORY],
  },
  {
    id: 'sys-income',
    title: 'Thu nhập',
    icon: 'trending-up-outline',
    color: '#059669',
    bgColor: '#D1FAE5',
    isDefault: true,
    items: [FUND_WITHDRAW_CATEGORY],
  },
];
