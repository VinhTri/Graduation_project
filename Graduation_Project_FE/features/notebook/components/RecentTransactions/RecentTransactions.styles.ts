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
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PASTEL_PALETTE.border,
  },
  transactionItemLast: {
    borderBottomWidth: 0,
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
});
