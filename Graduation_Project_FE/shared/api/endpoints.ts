// File này chứa tất cả các đường dẫn (URL) API của hệ thống
// Khi Backend thay đổi link, chỉ cần vào đây sửa 1 lần là xong.

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',                                // Đăng nhập
    REGISTER: '/api/v1/auth/register',                          // Đăng ký tài khoản
    SEND_OTP: '/api/v1/auth/register/send-otp',                 // Gửi mã OTP đăng ký
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',            // Quên mật khẩu
  },
  USER: {
    PROFILE: '/api/v1/user/me',                                 // Lấy thông tin tài khoản đang đăng nhập
  },
  TRANSACTION: {
    TOP_UP: '/api/v1/transactions/top-up',
    GET_STATUS: (code: string) => `/api/v1/transactions/${code}`,
  },
  WALLET: {
    MY_WALLET: '/api/v1/wallets/me',
  }
};
