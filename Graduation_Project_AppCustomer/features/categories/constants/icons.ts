/**
 * 24 icon thực tế cho chi tiêu/thu nhập.
 * Dùng chung khi tạo nhóm & danh mục — mỗi cấp không được chọn trùng icon.
 */
export const CATEGORY_ICONS = [
  // Ăn uống
  'restaurant',
  'cafe',
  'fast-food',
  'pizza',
  // Mua sắm
  'cart',
  'bag-handle',
  'shirt',
  'pricetag',
  // Di chuyển
  'car',
  'bus',
  'bicycle',
  'airplane',
  // Nhà cửa / hóa đơn
  'home',
  'flash',
  'water',
  'wifi',
  // Sức khỏe / giáo dục
  'medkit',
  'fitness',
  'school',
  'book',
  // Giải trí / tài chính
  'game-controller',
  'film',
  'receipt',
  'cash',
] as const

/** Nhóm cũng chọn trong 24 icon (tối đa 6 nhóm → không trùng icon giữa các nhóm). */
export const GROUP_ICONS = CATEGORY_ICONS

export type CategoryIconName = (typeof CATEGORY_ICONS)[number]
export type GroupIconName = (typeof GROUP_ICONS)[number]

export const getAvailableGroupIcons = (usedIcons: string[]): string[] => {
  const used = new Set(usedIcons.map((icon) => icon.trim().toLowerCase()))
  return GROUP_ICONS.filter((icon) => !used.has(icon.toLowerCase()))
}

export const getAvailableCategoryIcons = (usedIcons: string[]): string[] => {
  const used = new Set(usedIcons.map((icon) => icon.trim().toLowerCase()))
  return CATEGORY_ICONS.filter((icon) => !used.has(icon.toLowerCase()))
}
