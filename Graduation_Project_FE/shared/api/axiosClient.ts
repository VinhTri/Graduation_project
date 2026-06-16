import axios from 'axios';
import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Sử dụng IP mạng LAN của máy tính để chạy được trên cả Máy ảo lẫn Điện thoại thật (Expo Go)
const BASE_URL = 'http://192.168.5.37:8080';

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
  (error) => {
    // Xử lý lỗi hệ thống chung (ví dụ: 401 Chưa xác thực, 500 Lỗi server)
    console.warn(`Lỗi API [${error.config?.url}]:`, error?.response?.data || error.message);
    return Promise.reject(error?.response?.data || error);
  }
);
