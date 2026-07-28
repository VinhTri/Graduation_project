// File này chứa tất cả các đường dẫn (URL) API của hệ thống
// Khi Backend thay đổi link, chỉ cần vào đây sửa 1 lần là xong.

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',                                // Đăng nhập
    REGISTER: '/api/v1/auth/register',                          // Đăng ký tài khoản
    SEND_OTP: '/api/v1/auth/register/send-otp',                 // Gửi mã OTP đăng ký
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',            // Quên mật khẩu
    RESET_PASSWORD: '/api/v1/auth/reset-password',              // Đặt lại mật khẩu
    CHANGE_PASSWORD: '/api/v1/auth/change-password',            // Đổi mật khẩu (đã đăng nhập)
    VERIFY_OTP: '/api/v1/auth/verify-otp',                      // Kiểm tra OTP
    FORGOT_PIN: '/api/v1/auth/forgot-pin',                      // Quên mã PIN
    RESET_PIN: '/api/v1/auth/reset-pin',                        // Đặt lại mã PIN
    CHANGE_PIN: '/api/v1/auth/change-pin',                      // Đổi mã PIN (đã đăng nhập)
  },
  USER: {
    PROFILE: '/api/v1/user/me',                                 // Lấy thông tin tài khoản đang đăng nhập
    AVATAR: '/api/v1/user/avatar',                              // Upload ảnh đại diện
    SEARCH: (query: string) => `/api/v1/user/search?query=${encodeURIComponent(query)}`, // Tra cứu user theo email hoặc tài khoản
  },
  TRANSACTION: {
    TOP_UP: '/api/v1/transactions/top-up',
    WITHDRAW: '/api/v1/transactions/withdraw',
    MANUAL: '/api/v1/transactions/manual',
    TRANSFER: '/api/v1/transactions/transfer',
  },
  WALLET: {
    MY_WALLET: '/api/v1/wallets/me',
    CASH_WALLET: '/api/v1/wallets/cash',
    UPDATE_SETTINGS: (id: number) => `/api/v1/wallets/${id}/settings`,
  },
  HISTORY: {
    TRANSACTIONS: '/api/v1/history/transactions',
  },
  BANK_ACCOUNT: {
    GET_ALL: '/api/v1/bank-accounts',
  },
  REPORT: {
    DISTRIBUTION: '/api/v1/reports/distribution',
    TREND: '/api/v1/reports/trend',
  },
  INVOICE: {
    BASE: '/api/v1/invoices',
    DETAIL: (id: number) => `/api/v1/invoices/${id}`,
    STATUS: (id: number) => `/api/v1/invoices/${id}/status`,
  },
  NOTIFICATION: {
    GET_ALL: '/api/v1/notifications',
    UNREAD_COUNT: '/api/v1/notifications/unread-count',
    READ_ALL: '/api/v1/notifications/read-all',
    DELETE: (id: number) => `/api/v1/notifications/${id}`,
  },
  FRIENDSHIP: {
    REQUEST: (email: string) => `/api/v1/friends/request?email=${encodeURIComponent(email)}`,
    ACCEPT: (id: number) => `/api/v1/friends/accept/${id}`,
    REJECT: (id: number) => `/api/v1/friends/reject/${id}`,
    CANCEL: (id: number) => `/api/v1/friends/cancel/${id}`,
    REMOVE: (id: number) => `/api/v1/friends/remove/${id}`,
    LIST_FRIENDS: '/api/v1/friends',
    LIST_REQUESTS: '/api/v1/friends/requests',
    LIST_SENT_REQUESTS: '/api/v1/friends/sent-requests',
  },
  FUND: {
    LIST: '/api/v1/funds',
    CREATE: '/api/v1/funds',
    DETAIL: (id: number) => `/api/v1/funds/${id}`,
    DELETE: (id: number) => `/api/v1/funds/${id}`,
    DEPOSIT: (id: number) => `/api/v1/funds/${id}/deposit`,
    WITHDRAW: (id: number) => `/api/v1/funds/${id}/withdraw`,
    UPDATE_NOTE: (id: number, txId: number) => `/api/v1/funds/${id}/transactions/${txId}/note`,
    INVITE: (id: number) => `/api/v1/funds/${id}/invite`,
    ACCEPT_INVITE: (id: number) => `/api/v1/funds/${id}/accept-invite`,
    REJECT_INVITE: (id: number) => `/api/v1/funds/${id}/reject-invite`,
    LEAVE: (id: number) => `/api/v1/funds/${id}/leave`,
  },
  POSTS: {
    PUBLIC_ALL: '/api/v1/public/posts',
  },
  BUDGET: {
    BASE: '/api/budgets',
    DETAIL: (id: number) => `/api/budgets/${id}`,
    SUMMARY: '/api/budgets/summary',
  }
};
