import { StyleSheet, Dimensions } from 'react-native';
import { FUND_PALETTE } from '../../theme';

export const styles = StyleSheet.create({
  cardShadow: {
    marginBottom: 16,
    borderRadius: 22,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#1E1B4B',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
  },

  /* HERO HEADER BANNER */
  heroBanner: {
    height: 145,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  /* Top Tags Row */
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  inviteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  themeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Fund Title in Hero */
  heroBottomContent: {
    gap: 4,
  },
  fundName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* CARD BODY */
  cardBody: {
    padding: 16,
  },

  /* Inviter Profile Row */
  inviterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    padding: 2,
    backgroundColor: '#FDF2F8',
    borderWidth: 2,
    borderColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviterInfo: {
    flex: 1,
  },
  inviterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inviterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  inviterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },

  /* Stats / Target Box */
  statsBox: {
    backgroundColor: '#FFF5F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  statsBoxDark: {
    backgroundColor: 'rgba(49, 46, 129, 0.45)',
    borderColor: '#4338CA',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#FBCFE8',
    marginHorizontal: 12,
  },
  statDividerDark: {
    backgroundColor: '#4338CA',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#BE185D',
  },
  statValueTarget: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },

  /* Progress bar container */
  progressWrap: {
    marginTop: 10,
    gap: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarTrackDark: {
    backgroundColor: '#3730A3',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EC4899',
  },
  minDepositText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },

  /* ACTION BUTTONS */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rejectBtnDark: {
    backgroundColor: 'rgba(30, 27, 75, 0.6)',
    borderColor: '#3730A3',
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  rejectTextDark: {
    color: '#9CA3AF',
  },

  acceptBtnGradientWrap: {
    flex: 1.5,
    borderRadius: 14,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.65,
  },

  /* Common text colors for dark mode */
  textLight: {
    color: '#F9FAFB',
  },
  textMutedLight: {
    color: '#9CA3AF',
  },
});
