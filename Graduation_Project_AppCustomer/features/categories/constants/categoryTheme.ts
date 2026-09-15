export type ColorTheme = {
  color: string
  bgColor: string
}

export const FUND_RESERVED_COLORS: ColorTheme[] = [
  { color: '#DC2626', bgColor: '#FEE2E2' },
  { color: '#059669', bgColor: '#D1FAE5' },
]

/** 24 màu dùng chung cho nhóm & danh mục — mỗi bên không được chọn trùng trong cùng cấp. */
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
]

/** Nhóm cũng chọn trong 24 màu (tối đa 6 nhóm → không trùng màu giữa các nhóm). */
export const GROUP_COLORS = CATEGORY_COLORS

const normalizeHex = (hex: string) => hex.trim().toUpperCase()

export const getAvailableGroupColors = (usedColors: string[]): ColorTheme[] => {
  const used = new Set(usedColors.map(normalizeHex))
  return GROUP_COLORS.filter((c) => !used.has(normalizeHex(c.color)))
}

export const getAvailableCategoryColors = (usedColors: string[]): ColorTheme[] => {
  const used = new Set(usedColors.map(normalizeHex))
  return CATEGORY_COLORS.filter((c) => !used.has(normalizeHex(c.color)))
}
