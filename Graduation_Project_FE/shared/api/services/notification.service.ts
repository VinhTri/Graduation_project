import { axiosClient } from "../axiosClient";
import { ENDPOINTS } from "../endpoints";

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getAll: async () => {
    const response = await axiosClient.get(ENDPOINTS.NOTIFICATION.GET_ALL);
    return response;
  },

  getUnreadCount: async () => {
    const response = await axiosClient.get(ENDPOINTS.NOTIFICATION.UNREAD_COUNT);
    return response;
  },

  readAll: async () => {
    const response = await axiosClient.put(ENDPOINTS.NOTIFICATION.READ_ALL);
    return response;
  }
};
