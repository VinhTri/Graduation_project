import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  Keyboard,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  friendshipService,
  FriendshipResponse,
  SearchUserResult,
} from '../../../../shared/api/services/friendship.service';
import { FundMember } from '../../types';
import { FUND_PALETTE } from '../../theme';
import { MAX_FUND_MEMBERS } from '../../constants';
import { fundStore } from '../../store/fundStore';
import { UserAvatar } from '../../../../shared/components/UserAvatar';
import SuccessModal from '../../../../shared/components/SuccessModal/SuccessModal';

type InviteFriendsModalProps = {
  visible: boolean;
  fundId: number;
  members: FundMember[];
  onClose: () => void;
  onInvited?: () => void;
  /** Hiện ngay trên màn chi tiết quỹ, không dùng bottom sheet */
  embedded?: boolean;
  /** Ô tìm kiếm do màn cha điều khiển */
  searchQuery?: string;
  /** Ẩn ô tìm / bộ đếm — dùng khi gộp vào tab Thành viên */
  hideChrome?: boolean;
  /** Chỉ hiện kết quả tìm (kèm trạng thái quỹ + bạn bè) */
  searchResultsMode?: boolean;
  /** Chủ quỹ mới được mời */
  canInvite?: boolean;
};

type InviteRow = {
  userId: number;
  username: string;
  email: string;
  accountNumber?: string | null;
  avatarUrl?: string | null;
  friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
};

export function InviteFriendsModal({
  visible,
  fundId,
  members,
  onClose,
  onInvited,
  embedded = false,
  searchQuery,
  hideChrome = false,
  searchResultsMode = false,
  canInvite = true,
}: InviteFriendsModalProps) {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<InviteRow[]>([]);
  const [query, setQuery] = useState('');
  const [submittedLocal, setSubmittedLocal] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [justInvitedIds, setJustInvitedIds] = useState<Set<number>>(new Set());
  const [searchResult, setSearchResult] = useState<InviteRow | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const searchReqId = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [visible]);

  const memberUserIds = useMemo(() => {
    const ids = new Set<number>(justInvitedIds);
    members.forEach((m) => {
      if (m.userId != null && (m.status === 'ACTIVE' || m.status === 'INVITED')) {
        ids.add(m.userId);
      }
    });
    return ids;
  }, [members, justInvitedIds]);

  const friendIds = useMemo(
    () => new Set(friends.map((f) => f.userId)),
    [friends]
  );

  const getFundStatus = useCallback(
    (userId: number): 'NONE' | 'INVITED' | 'ACTIVE' => {
      if (justInvitedIds.has(userId)) return 'INVITED';
      const member = members.find((m) => m.userId === userId);
      if (!member || member.status === 'LEFT') return 'NONE';
      if (member.status === 'INVITED') return 'INVITED';
      return 'ACTIVE';
    },
    [members, justInvitedIds]
  );

  const occupiedSlots = useMemo(
    () => members.filter((m) => m.status === 'ACTIVE' || m.status === 'INVITED').length,
    [members]
  );
  const memberLimitReached = occupiedSlots >= MAX_FUND_MEMBERS;

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await friendshipService.getFriends();
      const list = (res?.data || res || []) as FriendshipResponse[];
      setFriends(
        (Array.isArray(list) ? list : []).map((f) => ({
          userId: f.friendId,
          username: f.friendUsername,
          email: f.friendEmail,
          accountNumber: f.friendAccountNumber,
          avatarUrl: f.friendAvatarUrl,
          friendshipStatus: 'ACCEPTED',
        }))
      );
    } catch {
      setFriends([]);
      Alert.alert('Lỗi', 'Không tải được danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSubmittedLocal('');
      setSearchResult(null);
      setSearchError(null);
      setJustInvitedIds(new Set());
      loadFriends();
    }
  }, [visible, loadFriends]);

  const handleChangeQuery = (text: string) => {
    setQuery(text);
  };

  const submitLocalSearch = () => {
    const q = query.trim();
    Keyboard.dismiss();
    setSubmittedLocal(q);
    if (!q) {
      setSearchResult(null);
      setSearchError(null);
    }
  };

  const clearLocalSearch = () => {
    setQuery('');
    setSubmittedLocal('');
    setSearchResult(null);
    setSearchError(null);
  };

  const activeQuery = (searchQuery !== undefined ? searchQuery : submittedLocal).trim();

  useEffect(() => {
    if (!visible) return;

    const q = activeQuery;
    if (!q) {
      searchReqId.current += 1;
      setSearchResult(null);
      setSearchError(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError(null);
    const reqId = ++searchReqId.current;
    const timer = setTimeout(async () => {
      try {
        const res: any = await friendshipService.searchUser(q);
        if (reqId !== searchReqId.current) return;
        if (res?.success && res.data) {
          const data = res.data as SearchUserResult;
          setSearchResult({
            userId: data.id,
            username: data.username,
            email: data.email,
            accountNumber: data.accountNumber,
            avatarUrl: data.avatarUrl,
            friendshipStatus: data.friendshipStatus || 'NONE',
          });
          setSearchError(null);
        } else {
          setSearchResult(null);
          setSearchError(
            res?.message === 'Không thể tìm kiếm chính mình'
              ? res.message
              : null
          );
        }
      } catch {
        if (reqId !== searchReqId.current) return;
        setSearchResult(null);
      } finally {
        if (reqId === searchReqId.current) setSearching(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeQuery, visible]);

  const availableFriends = useMemo(
    () => friends.filter((f) => !memberUserIds.has(f.userId)),
    [friends, memberUserIds]
  );

  const searchHits = useMemo(() => {
    if (!activeQuery) return [] as InviteRow[];
    const q = activeQuery.toLowerCase();
    const byId = new Map<number, InviteRow>();

    const merge = (row: InviteRow) => {
      const prev = byId.get(row.userId);
      const isFriend =
        row.friendshipStatus === 'ACCEPTED' ||
        prev?.friendshipStatus === 'ACCEPTED' ||
        friendIds.has(row.userId);
      byId.set(row.userId, {
        username: row.username || prev?.username || '',
        email: row.email || prev?.email || '',
        accountNumber: row.accountNumber || prev?.accountNumber,
        avatarUrl: row.avatarUrl || prev?.avatarUrl,
        userId: row.userId,
        friendshipStatus: isFriend ? 'ACCEPTED' : row.friendshipStatus || prev?.friendshipStatus || 'NONE',
      });
    };

    friends.forEach((f) => {
      if (
        f.username.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.accountNumber || '').toLowerCase().includes(q)
      ) {
        merge(f);
      }
    });

    members.forEach((m) => {
      if (m.userId == null || m.status === 'LEFT') return;
      if (m.name.toLowerCase().includes(q)) {
        merge({
          userId: m.userId,
          username: m.name,
          email: '',
          avatarUrl: m.avatarUrl,
          friendshipStatus: friendIds.has(m.userId) ? 'ACCEPTED' : 'NONE',
        });
      }
    });

    if (searchResult) merge(searchResult);
    return Array.from(byId.values());
  }, [activeQuery, friends, members, friendIds, searchResult]);

  const displayList = searchResultsMode && activeQuery ? searchHits : availableFriends;

  const sheetHeight = useMemo(() => {
    const windowHeight = Dimensions.get('window').height;
    const preferred = windowHeight * 0.78;
    if (keyboardHeight <= 0) return preferred;
    const available = windowHeight - keyboardHeight - 12;
    return Math.max(280, Math.min(preferred, available));
  }, [keyboardHeight]);

  const handleInvite = async (row: InviteRow) => {
    if (memberUserIds.has(row.userId)) return;
    if (memberLimitReached) {
      Alert.alert(
        'Đã đạt tối đa',
        `Quỹ chỉ có tối đa ${MAX_FUND_MEMBERS} thành viên.`
      );
      return;
    }
    setInvitingId(row.userId);
    try {
      await fundStore.inviteMember(fundId, row.userId);
      setJustInvitedIds((prev) => new Set(prev).add(row.userId));
      onInvited?.();
      setSuccessMessage(
        row.friendshipStatus !== 'ACCEPTED'
          ? `Đã gửi lời mời tới ${row.username}. Khi họ tham gia quỹ, hai bạn sẽ trở thành bạn bè.`
          : `Đã gửi lời mời tới ${row.username}`
      );
      setSuccessVisible(true);
    } catch (err: any) {
      Alert.alert('Không thể mời', err?.message || 'Vui lòng thử lại');
    } finally {
      setInvitingId(null);
    }
  };

  const renderItem = ({ item }: { item: InviteRow }) => {
    const inviting = invitingId === item.userId;
    const fundStatus = getFundStatus(item.userId);
    const isFriend =
      item.friendshipStatus === 'ACCEPTED' || friendIds.has(item.userId);
    const canSendInvite = canInvite && fundStatus === 'NONE' && !memberLimitReached;

    const fundLabel =
      fundStatus === 'ACTIVE'
        ? 'Đã tham gia quỹ'
        : fundStatus === 'INVITED'
          ? 'Chờ tham gia quỹ'
          : 'Chưa tham gia quỹ';
    const friendLabel = isFriend ? 'Đã là bạn bè' : 'Chưa là bạn bè';

    return (
      <View style={styles.listItem}>
        <View style={styles.userInfo}>
          <UserAvatar
            name={item.username}
            avatarUrl={item.avatarUrl}
            size={44}
            borderWidth={0}
          />
          <View style={styles.userTextWrap}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.username}
            </Text>
            {searchResultsMode ? (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    fundStatus === 'ACTIVE'
                      ? styles.statusBadgeSuccess
                      : fundStatus === 'INVITED'
                        ? styles.statusBadgeWarn
                        : styles.statusBadgeMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      fundStatus === 'ACTIVE'
                        ? styles.statusTextSuccess
                        : fundStatus === 'INVITED'
                          ? styles.statusTextWarn
                          : styles.statusTextMuted,
                    ]}
                  >
                    {fundLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isFriend ? styles.statusBadgeFriend : styles.statusBadgeWarn,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isFriend ? styles.statusTextFriend : styles.statusTextWarn,
                    ]}
                  >
                    {friendLabel}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                  {item.email}
                </Text>
                {item.accountNumber ? (
                  <Text style={styles.userStk} numberOfLines={1} ellipsizeMode="tail">
                    STK: {item.accountNumber}
                  </Text>
                ) : null}
              </>
            )}
            {searchResultsMode && item.accountNumber ? (
              <Text style={styles.userStk} numberOfLines={1} ellipsizeMode="tail">
                STK: {item.accountNumber}
              </Text>
            ) : null}
          </View>
        </View>
        {searchResultsMode ? (
          fundStatus === 'NONE' && canInvite ? (
            <TouchableOpacity
              style={[styles.inviteBtn, (inviting || memberLimitReached) && styles.inviteBtnDisabled]}
              disabled={inviting || !canSendInvite}
              onPress={() => handleInvite(item)}
              activeOpacity={0.85}
            >
              {inviting ? (
                <ActivityIndicator size="small" color={FUND_PALETTE.white} />
              ) : (
                <Text style={styles.inviteBtnText}>Mời</Text>
              )}
            </TouchableOpacity>
          ) : fundStatus === 'INVITED' ? (
            <View style={styles.invitedChip}>
              <Text style={styles.invitedChipText}>Đã mời</Text>
            </View>
          ) : null
        ) : (
          <TouchableOpacity
            style={[
              styles.inviteBtn,
              (inviting || memberLimitReached) && styles.inviteBtnDisabled,
            ]}
            disabled={inviting || memberLimitReached}
            onPress={() => handleInvite(item)}
            activeOpacity={0.85}
          >
            {inviting ? (
              <ActivityIndicator size="small" color={FUND_PALETTE.white} />
            ) : (
              <Text style={styles.inviteBtnText}>Mời</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const showEmptySearch =
    searchResultsMode && !!activeQuery && displayList.length === 0 && !searching;

  const emptyText = searchError
    ? searchError
    : showEmptySearch
      ? 'Không tìm thấy người dùng. Thử email hoặc STK ví.'
      : availableFriends.length === 0 && friends.length > 0
        ? 'Bạn bè trong danh bạ đã tham gia quỹ này.'
        : 'Chưa có bạn bè trong danh bạ. Tìm theo email hoặc STK để mời.';

  const listBody = loading ? (
    <View style={[styles.center, hideChrome && styles.centerCompact]}>
      <ActivityIndicator color={FUND_PALETTE.primary} />
    </View>
  ) : searching && displayList.length === 0 ? (
    <View style={[styles.center, hideChrome && styles.centerCompact]}>
      <ActivityIndicator color={FUND_PALETTE.primary} />
    </View>
  ) : displayList.length === 0 ? (
    <View style={[styles.center, hideChrome && styles.centerCompact]}>
      <Feather name="users" size={hideChrome ? 24 : 32} color={FUND_PALETTE.textMuted} />
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  ) : (
    <View style={styles.list}>
      {displayList.map((item) => (
        <View key={item.userId}>{renderItem({ item })}</View>
      ))}
    </View>
  );

  const body = (
    <>
      {!hideChrome && !embedded && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mời bạn bè</Text>
            <Text style={styles.memberCountText}>
              {occupiedSlots}/{MAX_FUND_MEMBERS} thành viên
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
            hitSlop={12}
          >
            <Feather name="x" size={22} color={FUND_PALETTE.text} />
          </TouchableOpacity>
        </View>
      )}

      {!hideChrome && embedded && (
        <Text style={styles.memberCountTextEmbedded}>
          {occupiedSlots}/{MAX_FUND_MEMBERS} thành viên
        </Text>
      )}

      {!hideChrome && memberLimitReached && (
        <View style={[styles.limitBanner, embedded && styles.limitBannerEmbedded]}>
          <Feather name="info" size={16} color="#B45309" />
          <Text style={styles.limitBannerText}>
            Thành viên đã đạt tối đa ({MAX_FUND_MEMBERS}/{MAX_FUND_MEMBERS})
          </Text>
        </View>
      )}

      {!hideChrome && (
        <View style={[
          styles.searchBox,
          embedded && styles.searchBoxEmbedded,
          memberLimitReached && styles.searchBoxDisabled,
        ]}>
          <View style={styles.searchIconWrap}>
            <Feather name="search" size={18} color={FUND_PALETTE.primary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="vd: email, tên hoặc STK ví"
            placeholderTextColor={FUND_PALETTE.textMuted}
            value={query}
            onChangeText={handleChangeQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={submitLocalSearch}
            editable={!memberLimitReached}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={clearLocalSearch} hitSlop={8} style={styles.searchClearBtn}>
              <Feather name="x-circle" size={18} color={FUND_PALETTE.textMuted} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={submitLocalSearch}
            activeOpacity={0.85}
            disabled={memberLimitReached}
          >
            <Text style={styles.searchButtonText}>Tìm</Text>
          </TouchableOpacity>
        </View>
      )}

      {listBody}
    </>
  );

  if (embedded) {
    if (!visible) return null;
    return (
      <View style={hideChrome ? undefined : styles.embeddedPanel}>
        {body}
        <SuccessModal
          visible={successVisible}
          title="Đã gửi"
          message={successMessage}
          isAutoClose={true}
          autoCloseText=""
          variant="pastel"
          onClose={() => setSuccessVisible(false)}
        />
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 16),
              bottom: keyboardHeight,
            },
          ]}
        >
          {body}
        </View>
      </View>
      <SuccessModal
        visible={successVisible}
        title="Đã gửi"
        message={successMessage}
        isAutoClose={true}
        autoCloseText=""
        variant="pastel"
        onClose={() => setSuccessVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: FUND_PALETTE.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: FUND_PALETTE.text,
  },
  memberCountText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: FUND_PALETTE.textMuted,
  },
  memberCountTextEmbedded: {
    fontSize: 12,
    fontWeight: '600',
    color: FUND_PALETTE.textMuted,
    marginBottom: 10,
  },
  embeddedPanel: {
    backgroundColor: FUND_PALETTE.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: FUND_PALETTE.border,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  limitBannerEmbedded: {
    marginHorizontal: 0,
  },
  limitBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: FUND_PALETTE.white,
    borderWidth: 1.5,
    borderColor: FUND_PALETTE.border,
    gap: 0,
  },
  searchBoxEmbedded: {
    marginHorizontal: 0,
  },
  searchBoxDisabled: {
    opacity: 0.5,
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: FUND_PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
    fontSize: 15,
    color: FUND_PALETTE.text,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
    marginRight: 6,
  },
  searchButton: {
    backgroundColor: FUND_PALETTE.primaryMid,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  searchButtonText: {
    color: FUND_PALETTE.white,
    fontWeight: '800',
    fontSize: 14,
  },
  list: {
    gap: 12,
    paddingBottom: 8,
  },
  listItem: {
    backgroundColor: FUND_PALETTE.white,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F5F3FF',
    shadowColor: '#DDD6FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
    marginRight: 10,
  },
  userTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: FUND_PALETTE.text,
    marginBottom: 0,
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeWarn: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeMuted: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeFriend: {
    backgroundColor: '#EDE9FE',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#15803D',
  },
  statusTextWarn: {
    color: '#B45309',
  },
  statusTextMuted: {
    color: '#6B7280',
  },
  statusTextFriend: {
    color: '#6D28D9',
  },
  invitedChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexShrink: 0,
  },
  invitedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  notFriendBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  notFriendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  userEmail: {
    fontSize: 13,
    color: FUND_PALETTE.textMuted,
    fontWeight: '500',
  },
  userStk: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    marginTop: 2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
    paddingHorizontal: 24,
  },
  centerCompact: {
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: FUND_PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  inviteBtn: {
    backgroundColor: FUND_PALETTE.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    minWidth: 64,
    alignItems: 'center',
    flexShrink: 0,
  },
  inviteBtnDisabled: {
    opacity: 0.7,
  },
  inviteBtnText: {
    color: FUND_PALETTE.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
