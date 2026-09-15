import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export interface PostResponse {
  id: number;
  title: string;
  imageUrl: string;
  targetLink: string;
}

export const postService = {
  // Lấy danh sách các bài viết (banner) đang active
  getActivePosts: async (): Promise<PostResponse[]> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.POSTS.PUBLIC_ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
