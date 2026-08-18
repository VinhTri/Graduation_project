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
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: PASTEL_PALETTE.white,
  },
  optionSelected: {
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PASTEL_PALETTE.border,
    marginLeft: 50,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PASTEL_PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: PASTEL_PALETTE.accentDeep,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PASTEL_PALETTE.accentDeep,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  optionExample: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  checkSpacer: {
    width: 20,
  },
  previewCard: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 6,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
})
