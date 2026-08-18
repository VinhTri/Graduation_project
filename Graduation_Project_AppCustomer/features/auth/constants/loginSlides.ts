import { ImageSourcePropType } from 'react-native'

export type LoginSlide = {
  id: number
  badge: string
  title: string
  subtitle: string
  image: ImageSourcePropType
}

export const LOGIN_SLIDES: readonly LoginSlide[] = [
  {
    id: 1,
    badge: 'HỆ THỐNG',
    title: 'Tài chính tối giản',
    subtitle: 'Quản lý tập trung mọi dòng tiền cá nhân',
    image: require('../../../assets/images/login-slide-finance.png'),
  },
  {
    id: 2,
    badge: 'TÍNH NĂNG',
    title: 'Ngân sách & Tích lũy',
    subtitle: 'Theo dõi hạn mức và quỹ tiết kiệm thông minh',
    image: require('../../../assets/images/login-slide-budget.png'),
  },
  {
    id: 3,
    badge: 'DÒNG TIỀN',
    title: 'Kiểm soát thu chi',
    subtitle: 'Ghi chép nhanh và khoản chi định kỳ',
    image: require('../../../assets/images/login-slide-expense.png'),
  },
  {
    id: 4,
    badge: 'TRỢ LÝ AI',
    title: 'Trí tuệ nhân tạo AI',
    subtitle: 'Phân tích chi tiêu và gợi ý tài chính cá nhân',
    image: require('../../../assets/images/login-slide-ai.png'),
  },
] as const
