export type ColorTheme = {
  color: string;
  bgColor: string;
};

/** 2 màu dành riêng cho danh mục hệ thống Nạp quỹ / Rút quỹ — không dùng trong picker user */
export const FUND_RESERVED_COLORS: ColorTheme[] = [
  { color: '#DC2626', bgColor: '#FEE2E2' }, // Nạp quỹ
  { color: '#059669', bgColor: '#D1FAE5' }, // Rút quỹ
];

/**
 * 6 màu nhóm — mỗi user tối đa 6 nhóm, mỗi nhóm 1 màu, không trùng.
 * Không trùng với FUND_RESERVED_COLORS và CATEGORY_COLORS.
 */
export const GROUP_COLORS: ColorTheme[] = [
  { color: '#6366F1', bgColor: '#E0E7FF' }, // indigo
  { color: '#8B5CF6', bgColor: '#EDE9FE' }, // violet
  { color: '#EC4899', bgColor: '#FCE7F3' }, // pink
  { color: '#F97316', bgColor: '#FFEDD5' }, // orange
  { color: '#0EA5E9', bgColor: '#E0F2FE' }, // sky
  { color: '#64748B', bgColor: '#F1F5F9' }, // slate
];

/**
 * 24 màu danh mục (6 nhóm × 4 danh mục) — không trùng nhau,
 * không trùng GROUP_COLORS / FUND_RESERVED_COLORS để báo cáo ví & sổ tay không lẫn màu.
 */
export const CATEGORY_COLORS: ColorTheme[] = [
  { color: '#EF4444', bgColor: '#FEE2E2' },
  { color: '#F43F5E', bgColor: '#FFE4E6' },
  { color: '#E11D48', bgColor: '#FFE4E6' },
  { color: '#FB7185', bgColor: '#FFE4E6' },
  { color: '#F59E0B', bgColor: '#FEF3C7' },
  { color: '#EAB308', bgColor: '#FEF9C3' },
  { color: '#CA8A04', bgColor: '#FEF9C3' },
  { color: '#D97706', bgColor: '#FFEDD5' },
  { color: '#10B981', bgColor: '#D1FAE5' },
  { color: '#34D399', bgColor: '#D1FAE5' },
  { color: '#14B8A6', bgColor: '#CCFBF1' },
  { color: '#2DD4BF', bgColor: '#CCFBF1' },
  { color: '#3B82F6', bgColor: '#DBEAFE' },
  { color: '#2563EB', bgColor: '#DBEAFE' },
  { color: '#1D4ED8', bgColor: '#DBEAFE' },
  { color: '#38BDF8', bgColor: '#E0F2FE' },
  { color: '#A855F7', bgColor: '#F3E8FF' },
  { color: '#7C3AED', bgColor: '#EDE9FE' },
  { color: '#C026D3', bgColor: '#FAE8FF' },
  { color: '#DB2777', bgColor: '#FCE7F3' },
  { color: '#06B6D4', bgColor: '#CFFAFE' },
  { color: '#0891B2', bgColor: '#CFFAFE' },
  { color: '#84CC16', bgColor: '#ECFCCB' },
  { color: '#65A30D', bgColor: '#ECFCCB' },
];

/** @deprecated dùng GROUP_COLORS / CATEGORY_COLORS */
export const AVAILABLE_COLORS = CATEGORY_COLORS;

const normalizeHex = (hex: string) => hex.trim().toUpperCase();

export const isSameColor = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  return normalizeHex(a) === normalizeHex(b);
};

export const getAvailableGroupColors = (usedColors: string[]): ColorTheme[] => {
  const used = new Set(usedColors.map(normalizeHex));
  return GROUP_COLORS.filter((c) => !used.has(normalizeHex(c.color)));
};

export const getAvailableCategoryColors = (usedColors: string[]): ColorTheme[] => {
  const used = new Set(usedColors.map(normalizeHex));
  return CATEGORY_COLORS.filter((c) => !used.has(normalizeHex(c.color)));
};
