import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export interface FriendshipResponse {
  id: number;
  friendId: number;
  friendUsername: string;
  friendEmail: string;
  status: string;
  createdAt: string;
  requester: boolean;
}

export const friendshipService = {
  searchUser: async (email: string) => {
    const response = await axiosClient.get(ENDPOINTS.USER.SEARCH(email));
    return response;
  },

  sendRequest: async (email: string) => {
    const response = await axiosClient.post(ENDPOINTS.FRIENDSHIP.REQUEST(email));
    return response;
  },

  acceptRequest: async (id: number) => {
    const response = await axiosClient.put(ENDPOINTS.FRIENDSHIP.ACCEPT(id));
    return response;
  },

  rejectRequest: async (id: number) => {
    const response = await axiosClient.delete(ENDPOINTS.FRIENDSHIP.REJECT(id));
    return response;
  },

  removeFriend: async (id: number) => {
    const response = await axiosClient.delete(ENDPOINTS.FRIENDSHIP.REMOVE(id));
    return response;
  },

  getFriends: async () => {
    const response = await axiosClient.get(ENDPOINTS.FRIENDSHIP.LIST_FRIENDS);
    return response;
  },

  getRequests: async () => {
    const response = await axiosClient.get(ENDPOINTS.FRIENDSHIP.LIST_REQUESTS);
    return response;
  }
};
