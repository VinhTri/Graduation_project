export const getUserAvatarUrl = (seed: string, size = 128) => {
  const normalizedSeed = encodeURIComponent(seed.trim().toLowerCase() || 'smartspend-user');
  return `https://api.dicebear.com/7.x/lorelei/png?seed=${normalizedSeed}&size=${size}`;
};
