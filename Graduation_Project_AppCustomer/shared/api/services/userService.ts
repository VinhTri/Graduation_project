import { ENDPOINTS } from '../endpoints';
import { axiosClient } from '../axiosClient';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
  isActive?: boolean;
  accountNumber?: string | null;
  avatarUrl?: string | null;
}

export const userService = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await axiosClient.get(ENDPOINTS.USER.PROFILE);
    return response.data;
  },

  uploadAvatar: async (localUri: string): Promise<UserProfile> => {
    const filename = localUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = (match?.[1] || 'jpg').toLowerCase();
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: filename.includes('.') ? filename : `${filename}.jpg`,
      type: mime,
    } as any);

    const response = await axiosClient.post(ENDPOINTS.USER.AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
