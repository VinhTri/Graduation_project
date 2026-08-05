import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { FundInvitation } from '../../types';
import { pickFundTheme } from '../../theme';
import { formatCurrency } from '../../utils';
import { resolveMediaUrl } from '../../../../shared/utils/resolveMediaUrl';
import { styles } from './FundInvitationCard.styles';

interface FundInvitationCardProps {
  invitation: FundInvitation;
  onAccept: (invitation: FundInvitation) => void;
  onReject: (invitation: FundInvitation) => void;
  isDark?: boolean;
  loading?: boolean;
}

export default function FundInvitationCard({
  invitation,
  onAccept,
  onReject,
  isDark = false,
  loading = false,
}: FundInvitationCardProps) {
  const theme = pickFundTheme(invitation.coverColorSeed);
  const avatarUrl = resolveMediaUrl(invitation.ownerAvatar);
  const initial = (invitation.ownerName || 'U').charAt(0).toUpperCase();

  const targetAmount = invitation.targetAmount || 0;
  const balance = invitation.balance || 0;
  const hasTarget = targetAmount > 0;
  const progressRatio = hasTarget ? Math.min(balance / targetAmount, 1) : 0;
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <View style={styles.cardShadow}>
      <View style={[styles.card, isDark && styles.cardDark]}>
        {/* HERO BANNER COVER */}
        <View style={styles.heroBanner}>
          <Image
            source={theme.image}
            style={styles.heroImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
          />
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.85)']}
            style={styles.heroOverlay}
          />

          {/* Top row with badges */}
          <View style={styles.heroTopRow}>
            <View style={styles.inviteBadge}>
              <Feather name="gift" size={12} color="#FFFFFF" />
              <Text style={styles.inviteBadgeText}>Lời mời tham gia</Text>
            </View>

            <View style={styles.heroRightBadges}>
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>{theme.label}</Text>
              </View>
              <View style={styles.themeBadge}>
                <Feather name="users" size={11} color="#FFFFFF" />
                <Text style={styles.themeBadgeText}>{invitation.memberCount || 1}</Text>
              </View>
            </View>
          </View>

          {/* Bottom of hero banner: Fund name */}
          <View style={styles.heroBottomContent}>
            <Text style={styles.fundName} numberOfLines={1}>
              {invitation.fundName}
            </Text>
          </View>
        </View>

        {/* CARD BODY */}
        <View style={styles.cardBody}>
          {/* Inviter Row */}
          <View style={styles.inviterRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarRing}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{initial}</Text>
                  </View>
                )}
              </View>
              <View style={styles.crownBadge}>
                <FontAwesome5 name="crown" size={8} color="#FFFFFF" solid />
              </View>
            </View>

            <View style={styles.inviterInfo}>
              <View style={styles.inviterLabelRow}>
                <Text style={[styles.inviterLabel, isDark && styles.textMutedLight]}>
                  Chủ quỹ đã mời bạn:
                </Text>
              </View>
              <Text style={[styles.inviterName, isDark && styles.textLight]} numberOfLines={1}>
                {invitation.ownerName}
              </Text>
            </View>
          </View>

          {/* Stats Box */}
          <View style={[styles.statsBox, isDark && styles.statsBoxDark]}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isDark && styles.textMutedLight]}>Hiện có</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(balance)} ₫
                </Text>
              </View>

              {hasTarget && (
                <>
                  <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, isDark && styles.textMutedLight]}>Mục tiêu</Text>
                    <Text style={[styles.statValueTarget, isDark && styles.textLight]}>
                      {formatCurrency(targetAmount)} ₫
                    </Text>
                  </View>
                </>
              )}
            </View>

            {hasTarget && (
              <View style={styles.progressWrap}>
                <View style={[styles.progressBarTrack, isDark && styles.progressBarTrackDark]}>
                  <LinearGradient
                    colors={['#EC4899', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressText, { color: isDark ? '#F472B6' : '#BE185D' }]}>
                    Tiến độ đạt {progressPercent}%
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.rejectBtn,
                isDark && styles.rejectBtnDark,
                loading && styles.btnDisabled,
              ]}
              onPress={() => onReject(invitation)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.rejectText, isDark && styles.rejectTextDark]}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptBtnGradientWrap, loading && styles.btnDisabled]}
              onPress={() => onAccept(invitation)}
              disabled={loading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtn}
              >
                <Feather name="check" size={16} color="#FFFFFF" />
                <Text style={styles.acceptText}>Tham gia ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
