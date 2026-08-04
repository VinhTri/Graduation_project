import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PASTEL_PALETTE.subtitle,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  amountInputWrap: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  currencySuffix: {
    fontSize: 16,
    fontWeight: '700',
  },
  splitModeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  modeChipActive: {
    borderColor: PASTEL_PALETTE.accentDeep,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  friendsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  emptyFriendsText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  friendsList: {
    gap: 8,
    maxHeight: 240,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
  },
  friendEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  summaryBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryAmountHighlight: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtnText: {
    color: PASTEL_PALETTE.title,
    fontSize: 16,
    fontWeight: '600',
  },
});
