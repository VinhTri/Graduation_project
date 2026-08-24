import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Animated, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, PALETTE } from './ContactsScreen.styles';
import { friendshipService, FriendshipResponse, SearchUserResult } from '../../../../shared/api/services/friendship.service';
import { UserAvatar } from '../../../../shared/components/UserAvatar';
import { useToast } from '../../../../shared/components/Toast';

import { useLanguage, useTheme } from '../../../../shared/contexts/ThemeLanguageContext';

export const ContactsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS' | 'SENT'>('FRIENDS');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchUserResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [requests, setRequests] = useState<FriendshipResponse[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, sentRes] = await Promise.all([
        friendshipService.getRequests(),
        friendshipService.getSentRequests(),
      ]);

      if (reqRes.success) {
        setRequests(reqRes.data);
        setPendingCount(reqRes.data.length);
      }

      if (sentRes.success) {
        setSentRequests(sentRes.data);
        setSentCount(sentRes.data.length);
      }

      if (activeTab === 'FRIENDS') {
        const res = await friendshipService.getFriends();
        if (res.success) setFriends(res.data);
      }
    } catch (error) {
      console.log('Fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setSearchError(null);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    Keyboard.dismiss();
    setSearchError(null);
    setSearchResult(null);
    try {
      const res = await friendshipService.searchUser(query);
      if (res.success) {
        setSearchResult({
          ...res.data,
          friendshipStatus: res.data.friendshipStatus || 'NONE',
        });
      } else {
        if (res.message === "Không thể tìm kiếm chính mình") {
          setSearchError(res.message);
        } else {
          setSearchError("Không tìm thấy người dùng với email hoặc tài khoản này.");
        }
      }
    } catch (error) {
      setSearchError("Không thể kết nối đến máy chủ.");
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult || isSendingRequest) return;
    try {
      setIsSendingRequest(true);
      const res = await friendshipService.sendRequest(searchResult.email);
      if (res.success) {
        setSearchResult({
          ...searchResult,
          friendshipStatus: 'PENDING',
          friendshipId: res.data.id,
          requester: true,
        });
        showToast({ variant: 'success', message: isEn ? 'Friend request sent' : 'Đã gửi lời mời kết bạn' });
        fetchData();
      } else {
        showToast({ variant: 'error', message: res.message || (isEn ? 'Could not send request' : 'Không thể gửi lời mời') });
      }
    } catch (error: any) {
      showToast({ variant: 'error', message: error?.message || (isEn ? 'Something went wrong' : 'Có lỗi xảy ra') });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleCancelRequest = async (id?: number, email?: string) => {
    const requestId = id || searchResult?.friendshipId;
    if (!requestId) return;
    try {
      const res = await friendshipService.cancelRequest(requestId);
      if (res.success) {
        if (searchResult && (!email || searchResult.email === email || searchResult.friendshipId === requestId)) {
          setSearchResult({
            ...searchResult,
            friendshipStatus: 'NONE',
            friendshipId: undefined,
            requester: false,
          });
        }
        showToast({ variant: 'success', message: isEn ? 'Friend request cancelled' : 'Đã hủy lời mời kết bạn' });
        fetchData();
      } else {
        showToast({ variant: 'error', message: res.message || (isEn ? 'Could not cancel request' : 'Không thể hủy lời mời') });
      }
    } catch (error: any) {
      showToast({ variant: 'error', message: error?.message || (isEn ? 'Could not cancel request' : 'Không thể hủy lời mời') });
    }
  };

  const renderSearchAction = () => {
    if (!searchResult) return null;

    if (searchResult.friendshipStatus === 'ACCEPTED') {
      return (
        <View style={styles.friendStatusButton}>
          <Ionicons name="checkmark-circle" size={15} color="#059669" />
          <Text style={styles.friendStatusText}>{isEn ? 'Friends' : 'Bạn bè'}</Text>
        </View>
      );
    }

    if (searchResult.friendshipStatus === 'PENDING' && searchResult.requester) {
      return (
        <TouchableOpacity
          style={styles.pendingFriendButton}
          onPress={() => handleCancelRequest(searchResult.friendshipId, searchResult.email)}
          activeOpacity={0.85}
        >
          <Ionicons name="time-outline" size={14} color="#D97706" />
          <Text style={styles.pendingFriendText}>{isEn ? 'Sent' : 'Đã gửi'}</Text>
        </TouchableOpacity>
      );
    }

    if (searchResult.friendshipStatus === 'PENDING' && !searchResult.requester) {
      return (
        <TouchableOpacity
          style={styles.incomingRequestButton}
          onPress={() => setActiveTab('REQUESTS')}
          activeOpacity={0.85}
        >
          <Text style={styles.incomingRequestText}>{isEn ? 'Respond' : 'Phản hồi'}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.addFriendButton, isSendingRequest && { opacity: 0.6 }]}
        onPress={handleSendRequest}
        activeOpacity={0.85}
        disabled={isSendingRequest}
      >
        {isSendingRequest ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Ionicons name="person-add" size={14} color="#FFF" />
        )}
        <Text style={styles.addFriendText}>
          {isSendingRequest ? (isEn ? 'Sending...' : 'Đang gửi...') : (isEn ? 'Add' : 'Kết bạn')}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleAccept = async (id: number) => {
    try {
      const res = await friendshipService.acceptRequest(id);
      if (res.success) {
        showToast({ variant: 'success', message: isEn ? 'Friend request accepted' : 'Đã chấp nhận kết bạn' });
        fetchData();
      } else {
        showToast({ variant: 'error', message: res.message || (isEn ? 'Could not accept' : 'Không thể chấp nhận') });
      }
    } catch {
      showToast({ variant: 'error', message: isEn ? 'Could not accept' : 'Không thể chấp nhận' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await friendshipService.rejectRequest(id);
      if (res.success) {
        showToast({ variant: 'success', message: isEn ? 'Friend request declined' : 'Đã từ chối lời mời' });
        fetchData();
      } else {
        showToast({ variant: 'error', message: res.message || (isEn ? 'Could not decline' : 'Không thể từ chối') });
      }
    } catch {
      showToast({ variant: 'error', message: isEn ? 'Could not decline' : 'Không thể từ chối' });
    }
  };

  const handleRemoveFriend = async (id: number) => {
    try {
      const res = await friendshipService.removeFriend(id);
      if (res.success) {
        showToast({ variant: 'success', message: isEn ? 'Unfriended' : 'Đã hủy kết bạn' });
        fetchData();
      } else {
        showToast({ variant: 'error', message: res.message || (isEn ? 'Could not unfriend' : 'Không thể hủy kết bạn') });
      }
    } catch {
      showToast({ variant: 'error', message: isEn ? 'Could not unfriend' : 'Không thể hủy kết bạn' });
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    item: FriendshipResponse,
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
      extrapolate: 'clamp',
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteActionWrap,
          { transform: [{ scale }, { translateX }] },
        ]}
      >
        <RectButton
          style={styles.swipeDeleteButton}
          underlayColor="#DC2626"
          onPress={() => handleRemoveFriend(item.id)}
        >
          <LinearGradient
            colors={['#F43F5E', '#E11D48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.swipeDeleteGradient}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.swipeDeleteText}>{isEn ? 'Remove' : 'Hủy bạn'}</Text>
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  const renderUserInfo = (item: FriendshipResponse) => (
    <View style={styles.userInfo}>
      <UserAvatar
        name={item.friendUsername}
        avatarUrl={item.friendAvatarUrl}
        size={44}
        borderWidth={0}
      />
      <View style={styles.userTextWrap}>
        <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.friendUsername}
        </Text>
        <Text
          style={[styles.userEmail, { color: theme.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.friendEmail}
        </Text>
        {item.friendAccountNumber ? (
          <Text style={styles.userStk} numberOfLines={1} ellipsizeMode="tail">
            STK: {item.friendAccountNumber}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: FriendshipResponse }) => {
    if (activeTab === 'REQUESTS') {
      return (
        <View style={[styles.listItem, styles.listItemSpaced, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {renderUserInfo(item)}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptText}>{isEn ? 'Accept' : 'Đồng ý'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectText}>{isEn ? 'Reject' : 'Từ chối'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (activeTab === 'SENT') {
      return (
        <View style={[styles.listItem, styles.listItemSpaced, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {renderUserInfo(item)}
          <Text style={styles.sentStatusText}>{isEn ? 'Waiting' : 'Đang chờ'}</Text>
        </View>
      );
    }

    return (
      <View style={styles.friendSwipeContainer}>
        <Swipeable
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
          overshootRight={false}
          friction={2}
          rightThreshold={40}
        >
          <View style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {renderUserInfo(item)}
            <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
          </View>
        </Swipeable>
      </View>
    );
  };

  const renderEmpty = () => {
    const emptyConfig = {
      FRIENDS: {
        icon: 'people-outline' as const,
        title: isEn ? 'No friends yet' : 'Chưa có bạn bè nào',
        text: isEn ? 'Search for friends using email above.' : 'Tìm bạn bè bằng email ở trên để bắt đầu kết nối nhé.',
      },
      REQUESTS: {
        icon: 'mail-unread-outline' as const,
        title: isEn ? 'No new requests' : 'Không có lời mời mới',
        text: isEn ? 'Friend requests will appear here.' : 'Khi có lời mời kết bạn, chúng sẽ hiện ở đây.',
      },
      SENT: {
        icon: 'time-outline' as const,
        title: isEn ? 'No pending requests' : 'Chưa có lời mời đang chờ',
        text: isEn ? 'Sent requests waiting for response will appear here.' : 'Các lời mời bạn gửi và đang chờ phản hồi sẽ hiện ở đây.',
      },
    }[activeTab];

    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.isDark ? theme.bgSoft : PALETTE.lavenderSoft }]}>
          <Ionicons name={emptyConfig.icon} size={34} color={theme.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{emptyConfig.title}</Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{emptyConfig.text}</Text>
      </View>
    );
  };

  const listData =
    activeTab === 'FRIENDS' ? friends : activeTab === 'REQUESTS' ? requests : sentRequests;

  const content = (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={[...theme.headerGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 12 }]}
          >
            <View style={styles.headerDecorCircleLarge} />
            <View style={styles.headerDecorCircleSmall} />

            <View style={styles.leftSection}>
              <TouchableOpacity 
                style={styles.backButton} 
                activeOpacity={0.7}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)/home');
                  }
                }}
              >
                <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? '#FFFFFF' : '#7C3AED'} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <View style={styles.headerTitleRow}>
                  <Text style={[styles.headerTitle, { color: theme.isDark ? '#FFFFFF' : '#5B21B6' }]}>{t('contacts')}</Text>
                  <Text style={{ fontSize: 20 }}>💌</Text>
                </View>
                <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : '#7C3AED' }]}>{isEn ? 'Add friends & manage requests' : 'Kết bạn & quản lý lời mời'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={[styles.content, { backgroundColor: theme.bg }]}>
          <View style={styles.searchSection}>
            <Text style={[styles.searchHint, { color: theme.textSecondary }]}>{isEn ? 'Search friends by email or account number' : 'Tìm bạn bè bằng email hoặc STK ví'}</Text>
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.searchIconWrap, { backgroundColor: theme.isDark ? theme.bgSoft : PALETTE.accentSoft }]}>
                <Ionicons name="search" size={18} color={theme.primary} />
              </View>
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder={isEn ? 'e.g. email, name or account no.' : 'vd: email, tên hoặc STK ví'}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearSearch}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.85}>
                <Text style={styles.searchButtonText}>{isEn ? 'Search' : 'Tìm'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {searchResult && (
            <View style={[styles.searchResultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <UserAvatar
                name={searchResult.username}
                avatarUrl={searchResult.avatarUrl}
                size={44}
                borderWidth={0}
              />
              <View style={styles.searchResultInfo}>
                <Text style={[styles.searchResultName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {searchResult.username}
                </Text>
                <Text style={[styles.searchResultEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                  {searchResult.email}
                </Text>
                {searchResult.accountNumber ? (
                  <Text style={styles.searchResultStk} numberOfLines={1}>
                    STK: {searchResult.accountNumber}
                  </Text>
                ) : null}
              </View>
              <View style={styles.searchResultAction}>{renderSearchAction()}</View>
            </View>
          )}

          {searchError && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{searchError}</Text>
            </View>
          )}

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'FRIENDS' && styles.activeTab]}
              onPress={() => setActiveTab('FRIENDS')}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === 'FRIENDS' && styles.activeTabText]}>{isEn ? 'Friends' : 'Bạn bè'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'REQUESTS' && styles.activeTab]}
              onPress={() => setActiveTab('REQUESTS')}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === 'REQUESTS' && styles.activeTabText]}>{isEn ? 'Requests' : 'Lời mời'}</Text>
              {pendingCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SENT' && styles.activeTab]}
              onPress={() => setActiveTab('SENT')}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === 'SENT' && styles.activeTabText]}>{isEn ? 'Sent' : 'Đang chờ'}</Text>
              {sentCount > 0 && (
                <View style={[styles.badgeContainer, styles.sentBadgeContainer]}>
                  <Text style={styles.badgeText}>{sentCount > 99 ? '99+' : sentCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={PALETTE.accent} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
};

export default ContactsScreen;
