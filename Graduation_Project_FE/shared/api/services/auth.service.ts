import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { runConcurrent } from '../utils/concurrency';

// authService: Chứa các hàm liên quan đến xác thực người dùng (Đăng nhập, Đăng ký, Quên mật khẩu)
export const authService = {
  
  /**
   * Gọi API Đăng nhập
   * @param data Chứa username và password
   */
  login: async (data: { username: string; password: string }) => {
    return axiosClient.post(ENDPOINTS.AUTH.LOGIN, data);
  },

  /**
   * Gọi API Đăng ký tài khoản mới
   * @param data Chứa username, password, email và mã OTP xác nhận
   */
  register: async (data: { username: string; password: string; email: string; otp: string }) => {
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
  }
};
