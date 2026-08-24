import { StyleSheet } from 'react-native'

import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'



export const styles = StyleSheet.create({

  container: {

    flex: 1,

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

  rowWrap: {

    flexDirection: 'row',

    alignItems: 'stretch',

    marginBottom: 8,

    borderRadius: 16,

    overflow: 'hidden',

    backgroundColor: PASTEL_PALETTE.white,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.05,

    shadowRadius: 8,

    elevation: 2,

  },

  transactionItem: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 14,

    paddingLeft: 14,

    paddingRight: 6,

    backgroundColor: PASTEL_PALETTE.white,

  },

  transactionMain: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

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

    marginRight: 4,

  },

  amountIncome: {

    color: '#059669',

  },

  amountExpense: {

    color: '#DC2626',

  },

  arrowBtn: {

    width: 32,

    height: 32,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

  },

  deletePanel: {

    overflow: 'hidden',

    justifyContent: 'center',

  },

  deleteAction: {

    flex: 1,

    width: 72,

    backgroundColor: '#DC2626',

    alignItems: 'center',

    justifyContent: 'center',

  },

  deleteActionText: {

    color: PASTEL_PALETTE.white,

    fontSize: 14,

    fontWeight: '800',

  },

})


