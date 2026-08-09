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
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: PASTEL_PALETTE.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_PALETTE.border,
    justifyContent: 'space-around',
  },
  topTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  topTabActive: {
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  topTabTextActive: {
    color: PASTEL_PALETTE.accentDeep,
    fontWeight: '800',
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
