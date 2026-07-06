import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export const userService = {
  getProfile: async () => {
    return axiosClient.get(ENDPOINTS.USER.PROFILE);
  }
};
