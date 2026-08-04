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
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PASTEL_PALETTE.subtitle,
    marginTop: 2,
  },
  cancelBillHeaderBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelBillHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createdAtText: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
  },
  totalAmountLabel: {
    fontSize: 13,
    color: PASTEL_PALETTE.textGray,
    marginBottom: 4,
  },
  totalAmountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
    marginBottom: 14,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  noteText: {
    fontSize: 13,
    flex: 1,
  },
  myPayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  myPayLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  myPayAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  payNowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  myPaidBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  myPaidText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  membersCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  membersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  membersCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  membersPaidRatio: {
    fontSize: 13,
    fontWeight: '700',
  },
  membersList: {
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  memberAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  creatorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberAmountText: {
    fontSize: 13,
    marginTop: 2,
  },
  memberStatusCol: {
    alignItems: 'flex-end',
  },
  paidStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidStatusText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  pendingStatusText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  remindBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  remindBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 15,
    marginBottom: 16,
  },
  backBtnSolid: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnSolidText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
