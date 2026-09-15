import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  closeBtn: {
    padding: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginTop: 14,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  charCountLimit: {
    color: PASTEL_PALETTE.accentDeep,
  },
  input: {
    borderWidth: 1.5,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: PASTEL_PALETTE.textDark,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  formError: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  colorHint: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 10,
    lineHeight: 18,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: PASTEL_PALETTE.title,
  },
  previewBox: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: PASTEL_PALETTE.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
