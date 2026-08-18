import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 16,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: PASTEL_PALETTE.white,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
  tabTextActive: {
    color: PASTEL_PALETTE.title,
  },
  body: {
    flex: 1,
  },
  overviewPad: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  nestedPad: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingWrap: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  periodChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  periodChipActive: {
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderColor: PASTEL_PALETTE.accentDeep,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  periodChipTextActive: {
    color: PASTEL_PALETTE.title,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginLeft: 8,
  },
  card: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 12,
  },
  heroAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
    marginBottom: 12,
  },
  shareTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 12,
  },
  shareFill: {
    height: 10,
  },
  heroCols: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCol: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  heroColLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 4,
  },
  heroColValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  heroColPct: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: PASTEL_PALETTE.subtitle,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCell: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  summaryDelta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
  },
  metricBlock: {
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
  },
  barRow: {
    marginBottom: 8,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.gray100,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 999,
  },
  insight: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
    lineHeight: 20,
    marginTop: 4,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  vsCol: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
  },
  vsLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  vsValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  vsPct: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  vsMid: {
    fontSize: 11,
    fontWeight: '800',
    color: PASTEL_PALETTE.textMuted,
  },
  flowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PASTEL_PALETTE.border,
  },
  flowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  flowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
})
