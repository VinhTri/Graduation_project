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
  content: {
    flex: 1,
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
    marginBottom: 12,
  },
  card: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabelContainer: {
    flex: 1,
    marginRight: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: PASTEL_PALETTE.textMuted,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: PASTEL_PALETTE.border,
    marginVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: PASTEL_PALETTE.subtitle,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    padding: 0,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  progressTrack: {
    height: 6,
    backgroundColor: PASTEL_PALETTE.border,
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PASTEL_PALETTE.accentDeep,
  },
  progressFillOver: {
    backgroundColor: '#EF4444',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: PASTEL_PALETTE.subtitle,
    lineHeight: 19,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  saveButton: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: PASTEL_PALETTE.gray200,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.white,
  },
  saveButtonTextDisabled: {
    color: PASTEL_PALETTE.textMuted,
  },
})
