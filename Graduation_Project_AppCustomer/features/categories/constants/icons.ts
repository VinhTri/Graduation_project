/** 26 icon danh mục theo bộ dữ liệu demo — mỗi danh mục dùng một icon riêng. */
export const CATEGORY_ICONS = [
  // Ăn uống: Ăn sáng, Ăn trưa, Ăn tối, Cà phê, Ăn vặt
  'sunny',
  'restaurant',
  'moon',
  'cafe',
  'fast-food',

  // Nhà & hóa đơn: Thuê nhà, Điện, Nước, Internet, Điện thoại
  'home',
  'flash',
  'water',
  'wifi',
  'phone-portrait',

  // Đi lại: Xăng xe, Xe buýt, Taxi/Grab, Bảo dưỡng xe
  'speedometer',
  'bus',
  'car-sport',
  'construct',

  // Mua sắm: Quần áo, Đồ gia dụng, Mỹ phẩm, Mua sắm online
  'shirt',
  'bed',
  'sparkles',
  'bag-handle',

  // Sức khỏe & học tập: Khám bệnh, Thuốc, Học phí, Sách
  'medkit',
  'medical',
  'school',
  'book',

  // Thu nhập: Lương, Thưởng, Làm thêm, Đầu tư
  'cash',
  'gift',
  'briefcase',
  'trending-up',
  // Lựa chọn mở rộng
  'cart',
  'basket',
  'pricetag',
  'pizza',
  'bicycle',
  'airplane',
  'fitness',
  'game-controller',
  'film',
  'musical-notes',
  'receipt',
  'card',
  'paw',
  'ellipsis-horizontal-circle',
] as const

/** Icon tổng quát dành riêng cho nhóm; người dùng có nhiều lựa chọn hơn icon danh mục. */
export const GROUP_ICONS = [
  'restaurant',
  'home',
  'car',
  'cart',
  'school',
  'wallet',
  'cash',
  'briefcase',
  'receipt',
  'card',
  'trending-up',
  'pie-chart',
  'people',
  'person',
  'heart',
  'medkit',
  'fitness',
  'game-controller',
  'film',
  'musical-notes',
  'airplane',
  'bicycle',
  'paw',
  'gift',
  'book',
  'build',
  'leaf',
  'ellipsis-horizontal-circle',
  'cafe',
  'fast-food',
  'bag-handle',
  'shirt',
  'phone-portrait',
  'bus',
  'construct',
  'sparkles',
  'water',
  'wifi',
  'flash',
  'compass',
] as const

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
