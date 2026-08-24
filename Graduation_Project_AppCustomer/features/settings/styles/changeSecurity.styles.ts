import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const changeSecurityStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.white,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.bgSoft,
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
  },
})
