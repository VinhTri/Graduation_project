import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
  RefreshControl, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundHeaderShell, FundCard, FundInvitationCard } from '../../components';
import { ConfirmModal, SuccessModal } from '../../../../shared/components';
import { fundStore, useFunds, useFundError, useFundInvitations } from '../../store/fundStore';
import { FundInvitation } from '../../types';
import { FUND_PALETTE } from '../../theme';
import { MAX_OWNED_FUNDS, MAX_JOINED_FUNDS } from '../../constants';
import { styles } from './FundsScreen.styles';
import { useLanguage, useTheme } from '../../../../shared/contexts/ThemeLanguageContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BANNER_H_PAD = 20;
const BANNER_GAP = 10;
/** Full width content, tỉ lệ 16:9 — cover kín 2 bên */
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_H_PAD * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * (9 / 16));

const FUND_GOAL_BANNERS = [
  {
    id: 'savings',
    image: require('../../../../assets/images/fund-promo-savings.jpg'),
    title: 'Quỹ tiết kiệm',
    subtitle: 'Cùng góp tiền, chạm mục tiêu dễ hơn',
  },
  {
    id: 'travel',
    image: require('../../../../assets/images/fund-promo-travel.jpg'),
    title: 'Quỹ du lịch',
    subtitle: 'Rủ bạn bè góp chung cho chuyến đi',
  },
  {
    id: 'party',
    image: require('../../../../assets/images/fund-promo-party.jpg'),
    title: 'Quỹ tiệc tùng',
    subtitle: 'Chia sẻ chi phí công bằng, vui hơn',
  },
] as const;

export function FundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const funds = useFunds();
  const invitations = useFundInvitations();
  const loadError = useFundError();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';
  const [tab, setTab] = useState<'mine' | 'joined'>('mine');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedInvitation, setSelectedInvitation] = useState<FundInvitation | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [joinedFundInfo, setJoinedFundInfo] = useState<{ id: number; name: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      fundStore.refreshFunds().catch(() => {});
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fundStore.refreshFunds();
    } catch {
      // Handled in store
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Tab bar nổi (~78) + khoảng trống thêm để thẻ cuối không bị đè
  const bottomPad = Math.max(insets.bottom, 10) + 90;

  const myFunds = useMemo(() => funds.filter((f) => f.isOwner), [funds]);
  const joinedFunds = useMemo(() => funds.filter((f) => !f.isOwner), [funds]);
  const visibleFunds = tab === 'mine' ? myFunds : joinedFunds;
  const currentLimit = tab === 'mine' ? MAX_OWNED_FUNDS : MAX_JOINED_FUNDS;
  const createDisabled = myFunds.length >= MAX_OWNED_FUNDS;
  const canCreateMore = !createDisabled;

  const handleCreate = () => {
    if (createDisabled) return;
    router.push('/funds/create');
  };

  const handleOpenAcceptModal = (inv: FundInvitation) => {
    setSelectedInvitation(inv);
    setAcceptModalVisible(true);
  };

  const handleOpenRejectModal = (inv: FundInvitation) => {
    setSelectedInvitation(inv);
    setRejectModalVisible(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedInvitation) return;
    const inv = selectedInvitation;
    setAcceptModalVisible(false);
    try {
      await fundStore.acceptInvite(inv.fundId);
      setJoinedFundInfo({ id: inv.fundId, name: inv.fundName });
      setSuccessModalVisible(true);
      setTab('joined');
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (code === 'FUND_8001' || msg.includes('Không tìm thấy quỹ') || msg.includes('không tồn tại')) {
        Alert.alert('Thông báo', 'Quỹ này đã bị chủ quỹ xóa hoặc không còn tồn tại.');
        await fundStore.refreshFunds().catch(() => {});
      } else {
        Alert.alert('Lỗi', msg || 'Không thể tham gia quỹ');
      }
    } finally {
      setSelectedInvitation(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedInvitation) return;
    const inv = selectedInvitation;
    setRejectModalVisible(false);
    try {
      await fundStore.rejectInvite(inv.fundId);
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (code === 'FUND_8001' || msg.includes('Không tìm thấy quỹ') || msg.includes('không tồn tại')) {
        Alert.alert('Thông báo', 'Quỹ này đã bị chủ quỹ xóa hoặc không còn tồn tại.');
        await fundStore.refreshFunds().catch(() => {});
      } else {
        Alert.alert('Lỗi', msg || 'Không thể từ chối lời mời');
      }
    } finally {
      setSelectedInvitation(null);
    }
  };

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (BANNER_WIDTH + BANNER_GAP));
    if (next !== bannerIndex && next >= 0 && next < FUND_GOAL_BANNERS.length) {
      setBannerIndex(next);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} />

      <FundHeaderShell
        coverImage={require('../../../../assets/images/funds-list-header.png')}
        coverTone="light"
        contentStyle={styles.header}
      >
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: theme.isDark ? '#FFFFFF' : '#5B21B6' }]}>{t('groupFunds')}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.createBtn, !canCreateMore && styles.createBtnDisabled]}
              onPress={handleCreate}
              activeOpacity={0.85}
              disabled={!canCreateMore}
            >
              <Feather name="plus" size={15} color={canCreateMore ? FUND_PALETTE.primaryDeep : '#9CA3AF'} />
              <Text style={[styles.createBtnText, !canCreateMore && styles.createBtnTextDisabled]}>
                {canCreateMore ? (isEn ? 'Create' : 'Tạo quỹ') : (isEn ? 'Limit' : 'Đạt Hạn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </FundHeaderShell>

      <ScrollView
        style={[styles.content, { backgroundColor: theme.bg }]}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {loadError ? (
          <TouchableOpacity
            onPress={onRefresh}
            activeOpacity={0.85}
            style={{
              marginBottom: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#FCA5A5',
              backgroundColor: theme.isDark ? '#451A1A' : '#FEF2F2',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: theme.isDark ? '#FECACA' : '#B91C1C', fontWeight: '700' }}>
              {loadError} · Chạm để thử lại
            </Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.bannerSection}>
          <FlatList
            data={FUND_GOAL_BANNERS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={BANNER_WIDTH + BANNER_GAP}
            snapToAlignment="start"
            contentContainerStyle={styles.bannerList}
            onScroll={onBannerScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.bannerSlide, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}
                activeOpacity={0.95}
                onPress={handleCreate}
              >
                <Image
                  source={item.image}
                  style={styles.bannerImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ width: BANNER_GAP }} />}
          />
          <View style={styles.bannerDots}>
            {FUND_GOAL_BANNERS.map((b, i) => (
              <View
                key={b.id}
                style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]}
              />
            ))}
          </View>
        </View>

        {invitations.length > 0 && (
          <View style={styles.invitationSection}>
            <View style={styles.invitationHeader}>
              <View style={styles.invitationHeaderLeft}>
                <View style={styles.invitationBadgeIcon}>
                  <Feather name="mail" size={14} color={theme.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'Fund Invitations' : 'Lời mời tham gia quỹ'}
                </Text>
              </View>
              <View style={styles.invitationCountBadge}>
                <Text style={styles.invitationCountText}>{invitations.length}</Text>
              </View>
            </View>

            {invitations.map((inv) => (
              <FundInvitationCard
                key={inv.id || inv.fundId}
                invitation={inv}
                onAccept={handleOpenAcceptModal}
                onReject={handleOpenRejectModal}
                isDark={theme.isDark}
              />
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{isEn ? 'Fund List' : 'Danh sách quỹ'}</Text>
          <View style={[styles.limitBadge, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}>
            <Feather name="layers" size={13} color={theme.primary} />
            <Text style={[styles.limitText, { color: theme.primary }]}>{visibleFunds.length}/{currentLimit} {isEn ? 'funds' : 'quỹ'}</Text>
          </View>
        </View>

        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'mine' && [styles.tabActive, { backgroundColor: theme.isDark ? theme.bgSoft : FUND_PALETTE.white }]]}
            onPress={() => setTab('mine')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: tab === 'mine' ? theme.primary : theme.textMuted }]}>
              {isEn ? `My Funds (${myFunds.length})` : `Quỹ của tôi (${myFunds.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'joined' && [styles.tabActive, { backgroundColor: theme.isDark ? theme.bgSoft : FUND_PALETTE.white }]]}
            onPress={() => setTab('joined')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.tabText, { color: tab === 'joined' ? theme.primary : theme.textMuted }]}>
                {isEn ? `Joined Funds (${joinedFunds.length})` : `Quỹ tham gia (${joinedFunds.length})`}
              </Text>
              {invitations.length > 0 && (
                <View style={styles.tabNotificationDot} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {visibleFunds.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.bgSoft }]}>
              <Feather name="inbox" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {tab === 'mine'
                ? (isEn ? 'No funds created yet' : 'Chưa có quỹ nào')
                : (isEn ? 'No joined funds yet' : 'Chưa tham gia quỹ nào')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {tab === 'mine'
                ? (isEn ? 'Create your first fund to start saving with friends' : 'Tạo quỹ đầu tiên để bắt đầu góp tiền cùng bạn bè')
                : (isEn ? 'You have not joined any group funds yet' : 'Bạn chưa tham gia vào quỹ nhóm nào')}
            </Text>
          </View>
        ) : (
          visibleFunds.map((fund) => (
            <FundCard
              key={fund.id}
              fund={fund}
              onPress={() => router.push(`/funds/${fund.id}`)}
            />
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={acceptModalVisible}
        title={isEn ? "Join Fund Confirmation" : "Xác nhận tham gia quỹ"}
        message={isEn 
          ? `Do you want to join the fund "${selectedInvitation?.fundName}" owned by ${selectedInvitation?.ownerName}?`
          : `Bạn có đồng ý tham gia quỹ "${selectedInvitation?.fundName}" do ${selectedInvitation?.ownerName} làm chủ quỹ không?`}
        iconName="people"
        confirmText={isEn ? "Join Now" : "Tham gia ngay"}
        cancelText={isEn ? "Later" : "Để sau"}
        isDestructive={false}
        onCancel={() => {
          setAcceptModalVisible(false);
          setSelectedInvitation(null);
        }}
        onConfirm={handleConfirmAccept}
      />

      <ConfirmModal
        visible={rejectModalVisible}
        title={isEn ? "Decline Invitation?" : "Từ chối lời mời?"}
        message={isEn
          ? `Are you sure you want to decline the invitation to join "${selectedInvitation?.fundName}" from ${selectedInvitation?.ownerName}?`
          : `Bạn có chắc muốn từ chối lời mời tham gia quỹ "${selectedInvitation?.fundName}" từ chủ quỹ ${selectedInvitation?.ownerName}?`}
        iconName="close-circle-outline"
        confirmText={isEn ? "Decline" : "Từ chối"}
        cancelText={isEn ? "Back" : "Quay lại"}
        isDestructive
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedInvitation(null);
        }}
        onConfirm={handleConfirmReject}
      />

      <SuccessModal
        visible={successModalVisible}
        title={isEn ? "Joined Fund Successfully!" : "Tham gia quỹ thành công!"}
        message={isEn
          ? `Congratulations! You are now a member of "${joinedFundInfo?.name}". Let's start managing funds together!`
          : `Chúc mừng bạn đã gia nhập quỹ "${joinedFundInfo?.name}". Hãy cùng các thành viên tích lũy và quản lý tài chính hiệu quả nhé!`}
        variant="pastel"
        onClose={() => {
          setSuccessModalVisible(false);
          if (joinedFundInfo?.id) {
            router.push(`/funds/${joinedFundInfo.id}`);
          }
        }}
      />
    </View>
  );
}
