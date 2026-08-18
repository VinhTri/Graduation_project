import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    gap: 12,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitIcon: {
    backgroundColor: '#EDE9FE',
  },
  tipTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  tipSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#C2410C',
  },
  limitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
  },
  limitSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6D28D9',
  },
  summaryCard: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  recentCard: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  summaryCol: {
    flex: 1,
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: PASTEL_PALETTE.border,
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 4,
  },
  summaryOut: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
  },
  summaryIn: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  summaryHint: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  emptyRecent: {
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PASTEL_PALETTE.border,
    gap: 10,
  },
  txRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    minWidth: 0,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  txMeta: {
    marginTop: 2,
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
})
