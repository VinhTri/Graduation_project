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
    USERNAME: '/api/v1/user/username',                          // Đổi tên hiển thị
    MONEY_FORMAT: '/api/v1/user/money-format',                  // Định dạng tiền tệ theo user
    APPEARANCE: '/api/v1/user/appearance',                      // Giao diện sáng/tối và ngôn ngữ
    NOTEBOOK_REMINDER: '/api/v1/user/notebook-reminder',        // Nhắc nhở ghi chép sổ tay
    SEARCH: (query: string) => `/api/v1/user/search?query=${encodeURIComponent(query)}`, // Tra cứu user theo email hoặc tài khoản
  },
  TRANSACTION: {
    TOP_UP: '/api/v1/transactions/top-up',
    WITHDRAW: '/api/v1/transactions/withdraw',
    TRANSFER: '/api/v1/transactions/transfer',
  },
  WALLET: {
    LIST: '/api/v1/wallets',
    DETAIL: (id: number) => `/api/v1/wallets/${id}`,
    WITHDRAW: '/api/v1/wallets/withdraw',
    TRANSACTIONS: '/api/v1/wallets/transactions',
    MY_WALLET: '/api/v1/wallets/me',
    UPDATE_SETTINGS: (id: number) => `/api/v1/wallets/${id}/settings`,
  },
  NOTEBOOK: {
    CASH: '/api/v1/notebooks/cash',
    TRANSACTIONS: (bookId: number, period: string) =>
      `/api/v1/notebooks/${bookId}/transactions?period=${period}`,
    CREATE_TRANSACTION: '/api/v1/notebooks/transactions',
    TRANSACTION_DETAIL: (code: string) => `/api/v1/notebooks/transactions/${code}`,
    UPDATE_TRANSACTION: (code: string) => `/api/v1/notebooks/transactions/${code}`,
    DELETE_TRANSACTION: (code: string) => `/api/v1/notebooks/transactions/${code}`,
  },
  CATEGORY: {
    LIST: '/api/v1/categories',
    GROUPS: '/api/v1/categories/groups',
    ITEMS: '/api/v1/categories/items',
    DELETE_ITEM: (itemId: number) => `/api/v1/categories/items/${itemId}`,
    DELETE_GROUP: (groupId: number) => `/api/v1/categories/groups/${groupId}`,
  },
  HISTORY: {
    TRANSACTIONS: '/api/v1/history/transactions',
  },
  BANK_ACCOUNT: {
    GET_ALL: '/api/v1/bank-accounts',
    DELETE: (id: number) => `/api/v1/bank-accounts/${id}`,
  },
  ACCOUNT: {
    VERIFY_PASSWORD: '/api/v1/account/verify-password',
    VERIFY_PIN: '/api/v1/account/verify-pin',
    CHANGE_PASSWORD: '/api/v1/account/change-password',
    CHANGE_PIN: '/api/v1/account/change-pin',
  },
  REPORT: {
    DISTRIBUTION: '/api/v1/reports/distribution',
    TREND: '/api/v1/reports/trend',
    FINANCE_CENTER: '/api/v1/reports/finance-center',
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
    INVITATIONS: '/api/v1/funds/invitations',
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
    LIST: '/api/v1/budgets',
    DETAIL: (id: number) => `/api/v1/budgets/${id}`,
  },
  AI: {
    CHAT: '/api/v1/ai/chat',
    HOME_INSIGHT: '/api/v1/ai/home-insight',
    FEEDBACK: '/api/v1/ai/feedback',
  },
  SPLIT_BILL: {
    BASE: '/api/v1/split-bills',
    DETAIL: (id: number) => `/api/v1/split-bills/${id}`,
    PAY: (id: number) => `/api/v1/split-bills/${id}/pay`,
    REMIND: (id: number, memberUserId: number) => `/api/v1/split-bills/${id}/remind/${memberUserId}`,
    CANCEL: (id: number) => `/api/v1/split-bills/${id}`,
  },
  SUPPORT: {
    TICKETS: '/api/v1/support/tickets',
    TICKET_DETAIL: (id: number) => `/api/v1/support/tickets/${id}`,
    CREATE_TICKET: '/api/v1/support/tickets',
    SEND_MESSAGE: (ticketId: number) => `/api/v1/support/tickets/${ticketId}/messages`,
  },
};
