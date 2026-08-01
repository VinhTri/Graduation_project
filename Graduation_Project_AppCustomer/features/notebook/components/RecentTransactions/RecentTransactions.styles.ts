import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  chipActive: {
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderColor: PASTEL_PALETTE.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  chipTextActive: {
    color: PASTEL_PALETTE.accentDeep,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  listCard: {
    // Removed border and background from here, moved to transactionItem
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: PASTEL_PALETTE.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItemLast: {
    marginBottom: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '500',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountIncome: {
    color: '#059669',
  },
  amountExpense: {
    color: '#DC2626',
  },
  swipeDeleteActionWrap: {
    width: 90,
    marginLeft: 8,
    marginBottom: 8,
  },
  swipeDeleteButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  swipeDeleteGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  swipeDeleteIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
