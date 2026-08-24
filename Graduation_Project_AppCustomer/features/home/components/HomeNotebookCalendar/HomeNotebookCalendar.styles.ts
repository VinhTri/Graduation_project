import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  shell: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PASTEL_PALETTE.subtitle,
    padding: 14,
  },
  headerRow: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMonth: {
    fontSize: 14,
    fontWeight: '800',
    color: PASTEL_PALETTE.subtitle,
  },
  calendarCard: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  weekdayRow: {
    flexDirection: 'row',
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PASTEL_PALETTE.border,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  weekdaySat: {
    color: PASTEL_PALETTE.lavender,
  },
  weekdaySun: {
    color: PASTEL_PALETTE.accentDeep,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellEmpty: {
    width: `${100 / 7}%`,
    minHeight: 64,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: PASTEL_PALETTE.border,
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 72,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: PASTEL_PALETTE.border,
    backgroundColor: PASTEL_PALETTE.white,
  },
  cellToday: {
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  cellFuture: {
    opacity: 0.45,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 4,
  },
  daySat: {
    color: PASTEL_PALETTE.lavender,
  },
  daySun: {
    color: PASTEL_PALETTE.accentDeep,
  },
  dayToday: {
    color: PASTEL_PALETTE.accentDeep,
  },
  status: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  statusLogged: {
    color: PASTEL_PALETTE.subtitle,
  },
  statusEmpty: {
    color: PASTEL_PALETTE.textMuted,
  },
  statusMuted: {
    fontSize: 10,
    color: PASTEL_PALETTE.border,
  },
  pickOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  pickSheet: {
    backgroundColor: PASTEL_PALETTE.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },
  pickTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 4,
  },
  pickHint: {
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 14,
    fontWeight: '500',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  pickIncome: {
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderColor: '#F9A8D4',
  },
  pickExpense: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  pickIncomeText: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.accentDeep,
  },
  pickExpenseText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  pickCancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pickCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
})
