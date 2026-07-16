import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export interface FriendshipResponse {
  id: number;
  friendId: number;
  friendUsername: string;
  friendEmail: string;
  friendAccountNumber?: string | null;
  status: string;
  createdAt: string;
  requester: boolean;
}

export interface SearchUserResult {
  id: number;
  username: string;
  email: string;
  accountNumber?: string | null;
  friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  friendshipId?: number;
  requester?: boolean;
}

export const friendshipService = {
  searchUser: async (query: string) => {
    const response = await axiosClient.get(ENDPOINTS.USER.SEARCH(query));
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

  cancelRequest: async (id: number) => {
    const response = await axiosClient.delete(ENDPOINTS.FRIENDSHIP.CANCEL(id));
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
  },

  getSentRequests: async () => {
    const response = await axiosClient.get(ENDPOINTS.FRIENDSHIP.LIST_SENT_REQUESTS);
    return response;
  },
};
