import { StyleSheet, Dimensions } from 'react-native';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';

const { width } = Dimensions.get('window');

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
    marginRight: 8,
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
    flexDirection: 'column',
    flex: 1,
  },
  headerTitle: {
    color: PASTEL_PALETTE.title,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: PASTEL_PALETTE.subtitle,
    fontWeight: '600',
    marginTop: 2,
  },
  keyboardContainer: {
    flex: 1,
  },

  // Ticket Overview Header Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ticketIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    lineHeight: 22,
    marginBottom: 6,
  },
  ticketDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketDateText: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    marginLeft: 4,
  },
  closedNotice: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedNoticeText: {
    fontSize: 11,
    color: PASTEL_PALETTE.subtitle,
    marginLeft: 6,
    flex: 1,
  },

  // Message list
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 14,
  },

  // User message bubble (Right)
  userBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  userBubble: {
    maxWidth: width * 0.78,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  userBubbleText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  userTimeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'right',
    marginTop: 4,
  },

  // Admin message bubble (Left)
  adminBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  adminAvatarBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  adminBubbleContainer: {
    maxWidth: width * 0.78,
  },
  adminSenderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  adminSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
  },
  adminRoleBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  adminRoleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
  },
  adminBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  adminBubbleText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  adminTimeText: {
    fontSize: 10,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },

  // Empty Messages
  emptyChatWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyChatText: {
    fontSize: 13,
    color: PASTEL_PALETTE.subtitle,
    marginTop: 6,
  },

  // Bottom Composer Bar
  composerWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F9',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 6,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    color: PASTEL_PALETTE.title,
    maxHeight: 100,
    minHeight: 36,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 1,
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
