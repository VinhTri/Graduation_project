import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginLeft: -8,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 10,
    marginTop: 8,
  },
  swipeHint: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '600',
  },
  bankScrollContent: {
    paddingBottom: 4,
    marginBottom: 8,
  },
  bankColumn: {
    gap: 10,
  },
  bankItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PASTEL_PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 84,
  },
  bankItemActive: {
    borderColor: PASTEL_PALETTE.accentDeep,
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  bankLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  bankLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
  },
  bankLogoFallbackText: {
    fontSize: 11,
    fontWeight: '800',
    color: PASTEL_PALETTE.subtitle,
  },
  bankShort: {
    fontSize: 11,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  inputBox: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    fontSize: 15,
    color: PASTEL_PALETTE.textDark,
    paddingVertical: 12,
  },
  hint: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: PASTEL_PALETTE.textMuted,
  },
  errorText: {
    marginTop: 10,
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: PASTEL_PALETTE.white,
    fontSize: 16,
    fontWeight: '800',
  },
})
