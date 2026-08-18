import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    paddingRight: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    maxWidth: 320,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  info: {
    borderColor: '#BFDBFE',
  },
  success: {
    borderColor: '#A7F3D0',
  },
  warning: {
    borderColor: '#FDE68A',
  },
  error: {
    borderColor: '#FECACA',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoIcon: {
    backgroundColor: '#3B82F6',
  },
  successIcon: {
    backgroundColor: '#10B981',
  },
  warningIcon: {
    backgroundColor: '#F59E0B',
  },
  errorIcon: {
    backgroundColor: '#EF4444',
  },
  textWrap: {
    flex: 1,
    paddingRight: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: PASTEL_PALETTE.textDark,
  },
  closeBtn: {
    padding: 2,
    marginTop: 2,
  },
})
