import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
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
import FundAvatar from '../FundAvatar/FundAvatar';

type InviteFriendsModalProps = {
  visible: boolean;
  fundId: number;
  members: FundMember[];
  onClose: () => void;
  onInvited?: () => void;
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
}: InviteFriendsModalProps) {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<InviteRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<InviteRow | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const ids = new Set<number>();
    members.forEach((m) => {
      if (m.userId != null && (m.status === 'ACTIVE' || m.status === 'INVITED')) {
        ids.add(m.userId);
      }
    });
    return ids;
  }, [members]);

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

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) {
      setSearchResult(null);
      setSearchError(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const res: any = await friendshipService.searchUser(q);
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
            : 'Không tìm thấy người dùng với email hoặc STK này.'
        );
      }
    } catch {
      setSearchResult(null);
      setSearchError('Không thể kết nối đến máy chủ.');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSearchResult(null);
      setSearchError(null);
      loadFriends();
    }
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [visible, loadFriends]);

  const handleChangeQuery = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const q = text.trim();
    if (!q) {
      setSearchResult(null);
      setSearchError(null);
      setSearching(false);
      return;
    }

    // Gõ email / STK → tự tìm user (kể cả chưa kết bạn)
    searchTimer.current = setTimeout(() => {
      runSearch(q);
    }, 450);
  };

  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      return (
        f.username.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.accountNumber || '').toLowerCase().includes(q)
      );
    });
  }, [friends, query]);

  const displayList = useMemo(() => {
    const q = query.trim();
    if (!q) return friends;

    // Có kết quả search API → ưu tiên hiển thị (gộp với bạn bè trùng id)
    if (searchResult) {
      const others = filteredFriends.filter((f) => f.userId !== searchResult.userId);
      return [searchResult, ...others];
    }

    return filteredFriends;
  }, [query, friends, filteredFriends, searchResult]);

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
      onInvited?.();
      Alert.alert('Đã gửi', `Đã gửi lời mời tới ${row.username}`);
    } catch (err: any) {
      Alert.alert('Không thể mời', err?.message || 'Vui lòng thử lại');
    } finally {
      setInvitingId(null);
    }
  };

  const renderItem = ({ item }: { item: InviteRow }) => {
    const alreadyIn = memberUserIds.has(item.userId);
    const inviting = invitingId === item.userId;
    const member = members.find((m) => m.userId === item.userId);
    const isFriend = item.friendshipStatus === 'ACCEPTED';
    const statusLabel =
      member?.status === 'INVITED'
        ? 'Đã mời'
        : member?.status === 'ACTIVE'
          ? 'Đã tham gia'
          : null;

    return (
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <FundAvatar
            name={item.username}
            avatarUrl={item.avatarUrl || undefined}
            size={44}
            seed={item.userId}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.username}
            </Text>
            {!isFriend && (
              <View style={styles.notFriendBadge}>
                <Text style={styles.notFriendText}>Chưa kết bạn</Text>
              </View>
            )}
          </View>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
            {item.accountNumber ? ` · ${item.accountNumber}` : ''}
          </Text>
        </View>
        {alreadyIn ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
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
    !!query.trim() && !searching && !searchResult && filteredFriends.length === 0;

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

          {memberLimitReached && (
            <View style={styles.limitBanner}>
              <Feather name="info" size={16} color="#B45309" />
              <Text style={styles.limitBannerText}>
                Thành viên đã đạt tối đa ({MAX_FUND_MEMBERS}/{MAX_FUND_MEMBERS})
              </Text>
            </View>
          )}

          <View style={[styles.searchBox, memberLimitReached && styles.searchBoxDisabled]}>
            <Feather name="search" size={18} color={FUND_PALETTE.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập email hoặc STK..."
              placeholderTextColor={FUND_PALETTE.textMuted}
              value={query}
              onChangeText={handleChangeQuery}
              onSubmitEditing={() => runSearch(query)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              editable={!memberLimitReached}
            />
            {searching ? (
              <ActivityIndicator size="small" color={FUND_PALETTE.primary} />
            ) : query.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setSearchResult(null);
                  setSearchError(null);
                }}
                hitSlop={8}
              >
                <Feather name="x-circle" size={16} color={FUND_PALETTE.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={FUND_PALETTE.primary} />
            </View>
          ) : (
            <FlatList
              data={displayList}
              keyExtractor={(item) => String(item.userId)}
              renderItem={renderItem}
              style={styles.listFlex}
              contentContainerStyle={
                displayList.length === 0 ? styles.emptyList : styles.list
              }
              ListEmptyComponent={
                <View style={styles.center}>
                  <Feather name="users" size={36} color={FUND_PALETTE.textMuted} />
                  <Text style={styles.emptyText}>
                    {showEmptySearch || searchError
                      ? searchError || 'Không tìm thấy người dùng'
                      : 'Bạn chưa có bạn bè để mời.\nNhập email hoặc STK để tìm nhanh.'}
                  </Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}
        </View>
      </View>
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
  listFlex: {
    flex: 1,
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
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: FUND_PALETTE.bgSoft,
    borderWidth: 1,
    borderColor: FUND_PALETTE.borderSoft,
    gap: 8,
  },
  searchBoxDisabled: {
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: FUND_PALETTE.text,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyList: {
    flexGrow: 1,
    paddingTop: 40,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: FUND_PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FUND_PALETTE.border,
  },
  avatarWrap: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: FUND_PALETTE.text,
    flexShrink: 1,
  },
  notFriendBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  notFriendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  email: {
    fontSize: 12,
    color: FUND_PALETTE.textMuted,
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: FUND_PALETTE.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  inviteBtnDisabled: {
    opacity: 0.7,
  },
  inviteBtnText: {
    color: FUND_PALETTE.white,
    fontWeight: '700',
    fontSize: 13,
  },
  badge: {
    backgroundColor: FUND_PALETTE.primarySofter,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: FUND_PALETTE.primaryDeep,
  },
});
