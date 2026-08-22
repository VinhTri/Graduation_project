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
  moneySuffix?: 'dong' | 'vnd';
  moneySeparator?: 'dot' | 'comma';
  themeMode?: 'light' | 'dark' | 'system';
  language?: 'vi' | 'en';
  notebookReminderEnabled?: boolean;
  notebookReminderTime?: string | null;
  token?: string;
}

export type MoneyFormatPayload = {
  suffix: 'dong' | 'vnd';
  separator: 'dot' | 'comma';
};

export type AppearancePayload = {
  themeMode: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
};

export type NotebookReminderPayload = {
  enabled: boolean;
  reminderTime?: string | null;
  appliesToday?: boolean;
};

export const userService = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await axiosClient.get(ENDPOINTS.USER.PROFILE);
    return response.data;
  },

  updateUsername: async (username: string): Promise<UserProfile> => {
    const response = await axiosClient.put(ENDPOINTS.USER.USERNAME, { username });
    return response.data;
  },

  updateMoneyFormat: async (prefs: MoneyFormatPayload): Promise<MoneyFormatPayload> => {
    const response = await axiosClient.put(ENDPOINTS.USER.MONEY_FORMAT, prefs);
    return response.data;
  },

  updateAppearance: async (prefs: AppearancePayload): Promise<AppearancePayload> => {
    const response = await axiosClient.put(ENDPOINTS.USER.APPEARANCE, prefs);
    return response.data;
  },

  updateNotebookReminder: async (prefs: NotebookReminderPayload): Promise<NotebookReminderPayload> => {
    const response = await axiosClient.put(ENDPOINTS.USER.NOTEBOOK_REMINDER, prefs);
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
