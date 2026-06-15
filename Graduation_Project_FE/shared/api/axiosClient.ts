import axios from 'axios';
import { Platform } from 'react-native';

// Sử dụng IP mạng LAN của máy tính để chạy được trên cả Máy ảo lẫn Điện thoại thật (Expo Go)
const BASE_URL = 'http://192.168.151.100:8080';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Thời gian chờ tối đa 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request (Gửi yêu cầu đi)
axiosClient.interceptors.request.use(
  async (config) => {
    // Thêm token xác thực (auth token) vào header tại đây (ví dụ: lấy từ AsyncStorage hoặc SecureStore)
    // const token = await SecureStore.getItemAsync('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
  (error) => {
    // Xử lý lỗi hệ thống chung (ví dụ: 401 Chưa xác thực, 500 Lỗi server)
    // Đổi console.error thành console.warn để không bị văng màn hình đỏ (LogBox) trên Expo khi API trả về lỗi cố ý (ví dụ sai mật khẩu)
    console.warn('Lỗi API:', error?.response?.data || error.message);
    return Promise.reject(error?.response?.data || error);
  }
);
