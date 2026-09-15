import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  container: {
    backgroundColor: PASTEL_PALETTE.white,
    marginHorizontal: 16,
    borderRadius: 20,
    marginTop: -18,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
    overflow: 'visible',
    zIndex: 1,
    shadowColor: PASTEL_PALETTE.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  totalCopy: {
    flex: 1,
    minWidth: 0,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
  totalValue: {
    marginTop: 1,
    fontSize: 22,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    letterSpacing: -0.3,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tileLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
  tileAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  centerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
  },
  centerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.subtitle,
  },
})
