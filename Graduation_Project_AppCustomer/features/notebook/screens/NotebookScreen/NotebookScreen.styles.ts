import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PASTEL_PALETTE.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
});
