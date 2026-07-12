import { StyleSheet, Platform, Dimensions } from 'react-native';
import Colors from '../../../../shared/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CAL_CELL_SIZE = Math.floor((SCREEN_WIDTH - 32 - 12) / 7); // 7 cols

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── HEADER ──────────────────────────────────────────────
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── MODE TABS ────────────────────────────────────────────
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  modeTabTextActive: {
    color: Colors.primary,
  },

  // ── NAVIGATOR (prev/next + label) ────────────────────────
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // ── SUMMARY BAR ──────────────────────────────────────────
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── CONTENT ──────────────────────────────────────────────
  content: {
    flex: 1,
  },

  // ── MONTH CALENDAR ───────────────────────────────────────
  calendarContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dayNames: {
    flexDirection: 'row',
    marginBottom: 4,
    marginTop: 8,
  },
  dayName: {
    width: CAL_CELL_SIZE,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    paddingVertical: 4,
  },
  dayNameSun: {
    color: '#EF4444',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CAL_CELL_SIZE,
    height: CAL_CELL_SIZE + 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  dayCellInner: {
    width: CAL_CELL_SIZE - 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 8,
    paddingVertical: 4,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberSun: {
    color: '#EF4444',
  },
  dayNumberToday: {
    color: Colors.primary,
  },
  dayDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    minHeight: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayAmount: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },

  // ── WEEK VIEW ────────────────────────────────────────────
  weekContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    marginBottom: 8,
  },
  weekBarCol: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  weekBarWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  weekBar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 4,
  },
  weekDayLabelSelected: {
    color: Colors.primary,
  },
  weekDayDate: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // ── DAY VIEW ─────────────────────────────────────────────
  timelineContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    marginBottom: 2,
    minHeight: 36,
  },
  timeLabel: {
    width: 44,
    fontSize: 11,
    color: Colors.textMuted,
    paddingTop: 8,
    textAlign: 'right',
    marginRight: 8,
  },
  timeContent: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: 12,
    paddingBottom: 4,
  },
  timeTransaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeTransactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeTransactionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  timeTransactionAmount: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── YEAR VIEW ─────────────────────────────────────────────
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  yearMonthCard: {
    width: (SCREEN_WIDTH - 24 - 30) / 3,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  yearMonthCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  yearMonthCardCurrent: {
    borderColor: Colors.primary,
  },
  yearMonthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  yearMonthLabelSelected: {
    color: Colors.primary,
  },
  yearMonthExpense: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 2,
  },
  yearMonthIncome: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  yearMonthEmpty: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  yearMonthBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  yearMonthBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.error,
  },

  // ── TRANSACTION LIST (below calendar) ────────────────────
  txSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  txSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTx: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTxText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
