import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerWrap: {
    // Removed because we use PastelHeaderShell
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  balanceWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: PASTEL_PALETTE.accentDeep,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnSpend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionBtnReceive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F9A8D4',
  },
  actionTextSpend: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  actionTextReceive: {
    color: PASTEL_PALETTE.accentDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: PASTEL_PALETTE.white,
    shadowColor: PASTEL_PALETTE.lavender,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  tabTextActive: {
    color: PASTEL_PALETTE.title,
    fontWeight: '800',
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
});
