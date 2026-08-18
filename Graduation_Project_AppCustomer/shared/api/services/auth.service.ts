import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { runConcurrent } from '../utils/concurrency';

// authService: Chứa các hàm liên quan đến xác thực người dùng (Đăng nhập, Đăng ký, Quên mật khẩu)
export const authService = {
  
  /**
   * Gọi API Đăng nhập
   * @param data email + password
   */
  login: async (data: { email: string; password: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.LOGIN, data);
  },

  /**
   * Gọi API Đăng ký tài khoản mới
   * @param data email + password + otp (tên hiển thị BE lấy từ phần trước @)
   */
  register: async (data: { password: string; email: string; otp: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.REGISTER, data);
  },

  /**
   * Gọi API Yêu cầu gửi mã OTP về email (để đăng ký)
   * @param data Chứa email cần gửi OTP
   */
  sendRegisterOtp: async (data: { email: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.SEND_OTP, data);
  },

  /**
   * Gọi API Quên mật khẩu
   * @param data Chứa email để khôi phục mật khẩu
   */
  forgotPassword: async (data: { email: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  },

  /**
   * Gọi API Đặt lại mật khẩu
   * @param data Chứa email, otp, và mật khẩu mới
   */
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
  },

  /**
   * Đổi mật khẩu khi đã đăng nhập (cần mật khẩu cũ)
   */
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },

  /**
   * Gọi API Kiểm tra mã OTP
   * @param data Chứa email, otp và purpose
   */
  verifyOtp: async (data: { email: string; otp: string; purpose: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.VERIFY_OTP, data);
  },

  /**
   * (Ví dụ mẫu) Hàm gọi nhiều API ĐỒNG THỜI
   * 
   * Trường hợp áp dụng: Khi bạn cần gửi mã OTP cho 2-3 email cùng một lúc để tiết kiệm thời gian chờ.
   * Cách hoạt động: Sử dụng hàm `runConcurrent` để chạy nhiều API, nếu 1 cái bị lỗi thì báo lỗi luôn.
   * 
   * @param emails Danh sách các email cần gửi OTP
   */
  sendMultipleOtps: async (emails: string[]) => {
    // Tạo ra một mảng chứa các hàm gọi API (chưa chạy ngay)
    const promises = emails.map(email => axiosClient.post(ENDPOINTS.AUTH.SEND_OTP, { email }));
    
    // Gọi hàm chạy đồng thời tất cả các API đã tạo
    return runConcurrent(promises as any);
  },

  /**
   * Gọi API Quên mã PIN (Gửi OTP)
   */
  forgotPin: async () => {
    return axiosClient.post(ENDPOINTS.AUTH.FORGOT_PIN);
  },

  /**
   * Gọi API Đặt lại mã PIN mới
   */
  resetPin: async (data: { otp: string; newPinCode: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.RESET_PIN, data);
  },

  /**
   * Đổi mã PIN khi đã đăng nhập (cần PIN cũ)
   */
  changePin: async (data: { currentPin: string; newPinCode: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.CHANGE_PIN, data);
  },
};
