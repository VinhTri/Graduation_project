import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  Animated, Easing, LayoutAnimation, Platform, UIManager,
  FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundHeaderShell, FundCard } from '../../components';
import { FundIcon } from '../../../../shared/components/FundIcon';
import { fundStore, useFunds } from '../../store/fundStore';
import { formatCurrency } from '../../utils';
import { FUND_PALETTE, FUND_TOTAL_GRADIENT } from '../../theme';
import { MAX_OWNED_FUNDS, MAX_JOINED_FUNDS } from '../../constants';
import { styles } from './FundsScreen.styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [tab, setTab] = useState<'mine' | 'joined'>('mine');
  const [totalExpanded, setTotalExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(110);
  const [bannerIndex, setBannerIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fundStore.refreshFunds().catch(() => {});
    }, [])
  );

  // Tab bar nổi (~78) + khoảng trống thêm để thẻ cuối không bị đè
  const bottomPad = Math.max(insets.bottom, 10) + 90;

  const expandAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: totalExpanded ? 1 : 0,
        friction: 9,
        tension: 68,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: totalExpanded ? contentHeight : 0,
        duration: totalExpanded ? 340 : 280,
        easing: totalExpanded
          ? Easing.out(Easing.cubic)
          : Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [contentHeight, expandAnim, heightAnim, totalExpanded]);

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const contentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.35, 1],
  });

  const contentTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const totalBalance = useMemo(
    () => funds.reduce((sum, f) => sum + f.balance, 0),
    [funds]
  );
  const totalMembers = useMemo(
    () => funds.reduce((sum, f) => sum + f.memberCount, 0),
    [funds]
  );

  const myFunds = useMemo(() => funds.filter((f) => f.isOwner), [funds]);
  const joinedFunds = useMemo(() => funds.filter((f) => !f.isOwner), [funds]);
  const visibleFunds = tab === 'mine' ? myFunds : joinedFunds;
  const currentLimit = tab === 'mine' ? MAX_OWNED_FUNDS : MAX_JOINED_FUNDS;
  const createDisabled = myFunds.length >= MAX_OWNED_FUNDS;

  const handleBack = () => router.replace('/(tabs)');

  const toggleTotalExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setTotalExpanded((v) => !v);
  };

  const handleCreate = () => {
    if (createDisabled) return;
    router.push('/funds/create');
  };

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (BANNER_WIDTH + BANNER_GAP));
    if (next !== bannerIndex && next >= 0 && next < FUND_GOAL_BANNERS.length) {
      setBannerIndex(next);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD6EC" />

      <FundHeaderShell contentStyle={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={24} color={FUND_PALETTE.subtitle} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>Quỹ nhóm</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.createBtn, createDisabled && styles.createBtnDisabled]}
              activeOpacity={createDisabled ? 1 : 0.85}
              onPress={handleCreate}
              disabled={createDisabled}
            >
              <Feather
                name={createDisabled ? 'slash' : 'plus'}
                size={14}
                color={createDisabled ? FUND_PALETTE.textMuted : FUND_PALETTE.white}
              />
              <Text style={[styles.createBtnText, createDisabled && styles.createBtnTextDisabled]}>
                {createDisabled ? 'Đã đạt tối đa' : 'Tạo quỹ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.95}
          onPress={toggleTotalExpanded}
        >
          <LinearGradient
            colors={FUND_TOTAL_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.totalCard, !totalExpanded && styles.totalCardCollapsed]}
          >
            <View style={styles.totalDecorCircle1} />
            <View style={styles.totalDecorCircle2} />

            <View style={styles.totalTopRow}>
              <FundIcon size={40} borderRadius={11} style={styles.totalLogo} />
              <Text style={styles.totalLabel} numberOfLines={1}>Tổng số dư các quỹ</Text>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.9)" />
              </Animated.View>
            </View>

            <Animated.View style={{ height: heightAnim, overflow: 'hidden' }}>
              <Animated.View
                style={{
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslateY }],
                }}
              >
                <View style={styles.totalValueRow}>
                  <Text style={styles.totalValue}>{formatCurrency(totalBalance)}</Text>
                  <Text style={styles.totalCurrency}>₫</Text>
                </View>

                <View style={styles.totalStatsRow}>
                  <View style={styles.totalStat}>
                    <Feather name="briefcase" size={13} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.totalStatText}>{funds.length} quỹ</Text>
                  </View>
                  <View style={styles.totalStatDivider} />
                  <View style={styles.totalStat}>
                    <Feather name="users" size={13} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.totalStatText}>{totalMembers} thành viên</Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>

            {/* Đo chiều cao thật của nội dung mở rộng */}
            <View
              pointerEvents="none"
              style={styles.totalMeasureWrap}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && Math.abs(h - contentHeight) > 1) {
                  setContentHeight(h);
                }
              }}
            >
              <View style={styles.totalValueRow}>
                <Text style={styles.totalValue}>{formatCurrency(totalBalance)}</Text>
                <Text style={styles.totalCurrency}>₫</Text>
              </View>
              <View style={styles.totalStatsRow}>
                <View style={styles.totalStat}>
                  <Feather name="briefcase" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.totalStatText}>{funds.length} quỹ</Text>
                </View>
                <View style={styles.totalStatDivider} />
                <View style={styles.totalStat}>
                  <Feather name="users" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.totalStatText}>{totalMembers} thành viên</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </FundHeaderShell>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner mục tiêu — trượt ngang */}
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

        {/* Section title + giới hạn số quỹ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách quỹ</Text>
          <View style={styles.limitBadge}>
            <Feather name="layers" size={13} color={FUND_PALETTE.primaryDeep} />
            <Text style={styles.limitText}>{visibleFunds.length}/{currentLimit} quỹ</Text>
          </View>
        </View>

        {/* Tabs phân loại */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === 'mine' && styles.tabActive]}
            onPress={() => setTab('mine')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
              Quỹ của tôi ({myFunds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'joined' && styles.tabActive]}
            onPress={() => setTab('joined')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'joined' && styles.tabTextActive]}>
              Quỹ tham gia ({joinedFunds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {visibleFunds.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={32} color={FUND_PALETTE.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'mine' ? 'Chưa có quỹ nào' : 'Chưa tham gia quỹ nào'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'mine'
                ? 'Tạo quỹ đầu tiên để bắt đầu góp tiền cùng bạn bè'
                : 'Nhấn "Tham gia" và nhập mã mời để vào quỹ của bạn bè'}
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
    </View>
  );
}
