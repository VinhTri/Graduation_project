export const PASTEL_PALETTE = {
  bg: '#FFF8FC',
  bgSoft: '#FFF1F8',
  headerStart: '#FFD6EC',
  headerMid: '#E9D5FF',
  headerEnd: '#BFDBFE',
  accent: '#F472B6',
  accentDeep: '#EC4899',
  accentSoft: '#FCE7F3',
  lavender: '#A78BFA',
  lavenderSoft: '#EDE9FE',
  title: '#5B21B6',
  subtitle: '#7C3AED',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  border: '#F3E8FF',
};

export const PASTEL_HEADER_GRADIENT = [
  PASTEL_PALETTE.headerStart,
  PASTEL_PALETTE.headerMid,
  PASTEL_PALETTE.headerEnd,
] as const;
