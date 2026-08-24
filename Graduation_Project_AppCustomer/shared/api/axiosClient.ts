import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearStoredSession } from '@/shared/services/sessionStorage';

// Tự động lấy IP của máy tính đang chạy Expo (dành cho chế độ Development)
const BACKEND_PORT = '9090'; // SỬA CỔNG PORT Ở ĐÂY NẾU ĐỒNG ĐỘI CỦA BẠN DÙNG CỔNG KHÁC
let BASE_URL = `http://localhost:${BACKEND_PORT}`; // Mặc định cho Web/Simulator
const debuggerHost = Constants.expoConfig?.hostUri;

if (__DEV__ && debuggerHost) {
  const ip = debuggerHost.split(':')[0]; // Lấy IP, bỏ phần port :8081
  BASE_URL = `http://${ip}:${BACKEND_PORT}`; // Tự động gắn IP với cổng Backend
} else if (process.env.EXPO_PUBLIC_API_URL) {
  // Ưu tiên dùng biến môi trường khi build thật (Production)
  BASE_URL = process.env.EXPO_PUBLIC_API_URL;
}

console.log("=== API BASE_URL IS: ===", BASE_URL);

export const getApiBaseUrl = () => BASE_URL;

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Tăng thời gian chờ lên 30 giây để tránh lỗi timeout do gửi email (SMTP) chậm
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request (Gửi yêu cầu đi)
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log(`[API Request] ${config.url} - Has Token: YES`);
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.log(`[API Request] ${config.url} - Has Token: NO`);
      }
    } catch (error) {
      console.log('Error reading token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response (Nhận phản hồi về)
axiosClient.interceptors.response.use(
  (response) => {
    // Xử lý dữ liệu trả về thành công tại đây, trả về trực tiếp response.data cho gọn
    return response.data;
  },
  async (error) => {
    // Xử lý lỗi hệ thống chung (ví dụ: 401 Chưa xác thực, 500 Lỗi server)
    console.warn(`Lỗi API [${error.config?.url}]:`, error?.response?.data || error.message);
    
    // 401 means the credential is invalid. A 403 only means the current user is
    // not allowed to perform that action and must not destroy the session.
    if (error?.response?.status === 401) {
      const failedAuthorization = error.config?.headers?.get?.('Authorization')
        ?? error.config?.headers?.Authorization;
      const failedToken = typeof failedAuthorization === 'string'
        ? failedAuthorization.replace(/^Bearer\s+/i, '')
        : null;
      const currentToken = await AsyncStorage.getItem('token');

      // A profile update can rotate the token while another request is in flight.
      // Never let a late response for the old token erase the new session.
      if (!currentToken || (failedToken && currentToken !== failedToken)) {
        return Promise.reject(error?.response?.data || error);
      }

      console.warn("Token không còn hợp lệ, đang chuyển về trang đăng nhập...");
      await clearStoredSession();
      
      // Chuyển hướng người dùng về màn hình đăng nhập
      // Yêu cầu import { router } from 'expo-router'; ở đầu file
      const { router } = require('expo-router');
      if (router) {
        // Tuỳ thuộc vào cấu trúc thư mục của bạn, đường dẫn có thể khác
        router.replace('/(auth)/login'); 
      }
    }

    const rejected = error?.response?.data || error;
    if (rejected && typeof rejected === 'object' && rejected.status == null) {
      rejected.status = error?.response?.status;
    }
    return Promise.reject(rejected);
  }
);
