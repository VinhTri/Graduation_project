import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: PASTEL_PALETTE.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 0,
  },
  charCountLimit: {
    color: PASTEL_PALETTE.accentDeep,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#F87171',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: PASTEL_PALETTE.title,
    paddingVertical: 10,
  },
  suffix: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
  error: {
    marginTop: 10,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  categoryCardEmpty: {
    borderStyle: 'dashed',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconEmpty: {
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  categoryTitleEmpty: {
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '600',
  },
  categoryHint: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnSpend: {
    backgroundColor: '#DC2626',
  },
  primaryBtnText: {
    color: PASTEL_PALETTE.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
