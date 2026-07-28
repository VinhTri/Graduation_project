import { getApiBaseUrl } from '../api/axiosClient';

/** Resolve relative /uploads paths and rewrite localhost for device LAN access. */
export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  const baseUrl = getApiBaseUrl().replace(/\/$/, '');

  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }

  if (url.includes('localhost')) {
    return url.replace(/https?:\/\/localhost:\d+/, baseUrl);
  }

  return url;
};
