import { ImageSourcePropType } from 'react-native';

// Bảng màu cho tính năng Quỹ — đồng bộ tông pastel (hồng/tím) giống Ví & các trang khác
export const FUND_PALETTE = {
  bg: '#FFF8FC',
  bgSoft: '#FFF1F8',
  // "primary*" giữ nguyên tên key để toàn bộ màn Quỹ tự cập nhật màu
  primary: '#EC4899',
  primaryMid: '#F472B6',
  primaryDeep: '#DB2777',
  primaryDark: '#BE185D',
  primarySoft: '#FCE7F3',
  primarySofter: '#FDF2F8',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',
  title: '#5B21B6',
  subtitle: '#7C3AED',
  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#F3E8FF',
  borderSoft: '#FBCFE8',
  white: '#FFFFFF',
  danger: '#EF4444',
  success: '#10B981',
};

// Gradient header pastel (đồng bộ với PastelHeaderShell của Ví)
export const FUND_HEADER_GRADIENT = [
  '#FFD6EC',
  '#E9D5FF',
  '#BFDBFE',
] as const;

// Gradient cho thẻ "Tổng số dư quỹ" — nổi bật trên nền pastel
export const FUND_TOTAL_GRADIENT = ['#EC4899', '#A855F7', '#8B5CF6'] as const;

export type FundTheme = {
  id: string;
  label: string;
  image: ImageSourcePropType;
  /** Màu phụ cho avatar / accent */
  accent: [string, string];
};

/** 6 chủ đề quỹ — coverColorSeed = index (0..5) */
export const FUND_THEMES: readonly FundTheme[] = [
  {
    id: 'travel',
    label: 'Du lịch',
    image: require('../../assets/images/fund-theme-travel.jpg'),
    accent: ['#F472B6', '#DB2777'],
  },
  {
    id: 'party',
    label: 'Tiệc tùng',
    image: require('../../assets/images/fund-theme-party.jpg'),
    accent: ['#A78BFA', '#7C3AED'],
  },
  {
    id: 'food',
    label: 'Ăn uống',
    image: require('../../assets/images/fund-theme-food.jpg'),
    accent: ['#FB7185', '#E11D48'],
  },
  {
    id: 'education',
    label: 'Học tập',
    image: require('../../assets/images/fund-theme-education.jpg'),
    accent: ['#6366F1', '#4338CA'],
  },
  {
    id: 'emergency',
    label: 'Dự phòng',
    image: require('../../assets/images/fund-theme-emergency.jpg'),
    accent: ['#F59E0B', '#D97706'],
  },
  {
    id: 'shopping',
    label: 'Mua sắm',
    image: require('../../assets/images/fund-theme-shopping.jpg'),
    accent: ['#38BDF8', '#0369A1'],
  },
] as const;

export const FUND_THEME_COUNT = FUND_THEMES.length;

export const pickFundTheme = (seed: number): FundTheme =>
  FUND_THEMES[Math.abs(seed) % FUND_THEME_COUNT];

export const pickFundCoverImage = (seed: number): ImageSourcePropType =>
  pickFundTheme(seed).image;

/** Giữ cho avatar thành viên / accent nhỏ */
export const pickFundGradient = (seed: number): [string, string] =>
  pickFundTheme(seed).accent;

/** @deprecated dùng FUND_THEMES — giữ alias để không vỡ import cũ */
export const FUND_CARD_GRADIENTS: readonly [string, string][] = FUND_THEMES.map((t) => t.accent);
