import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: PASTEL_PALETTE.border,
    backgroundColor: PASTEL_PALETTE.white,
    overflow: 'hidden',
  },
  itemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: PASTEL_PALETTE.white,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeTodo: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeDone: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextTodo: {
    color: '#D97706',
  },
  statusBadgeTextDone: {
    color: '#059669',
  },
  activeHint: {
    fontSize: 11,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPanel: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  budgetAction: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  budgetActionText: {
    color: PASTEL_PALETTE.white,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
  },
  deleteAction: {
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
