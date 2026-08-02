import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../../../../shared/constants/Colors';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PIE_PAGE_WIDTH = SCREEN_WIDTH - 40;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: PASTEL_PALETTE.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
    marginLeft: 6,
  },
  toggleTextActive: {
    color: Colors.primary,
  },

  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  periodChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
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
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  periodChipTextActive: {
    color: Colors.primaryDark,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  summaryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDFA',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: PASTEL_PALETTE.textMuted,
  },
  summaryLabelActive: {
    color: Colors.primary,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },

  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    minHeight: 220,
  },
  donutContainer: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 4,
    borderColor: '#F4F7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  legendContainer: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
    marginBottom: 14,
    marginHorizontal: '1%',
  },
  legendIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  legendLabel: {
    color: PASTEL_PALETTE.textMuted,
    fontSize: 12,
    marginTop: 0,
  },

  lineChartWrapper: {
    width: '100%',
    alignItems: 'stretch',
    minHeight: 260,
  },
  lineChartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  lineTrendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineChartLegendText: {
    fontSize: 13,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  lineChartHint: {
    fontSize: 11,
    color: PASTEL_PALETTE.textMuted,
    marginLeft: 'auto',
  },
  lineChartPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    paddingTop: 8,
    paddingBottom: 12,
  },
  lineChartScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pointerLabel: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  yAxisLabel: {
    color: PASTEL_PALETTE.textMuted,
    fontSize: 12,
  },
  emptyChartText: {
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontWeight: '600',
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 6,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASTEL_PALETTE.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PASTEL_PALETTE.title,
  },
  categoryItemSubtitle: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    marginTop: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
});
