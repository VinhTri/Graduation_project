import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { friendshipService, FriendshipResponse } from '@/shared/api/services/friendship.service';
import { splitBillService } from '@/shared/api/services/splitBillService';
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal';
import { styles } from './CreateSplitBillScreen.styles';

export const CreateSplitBillScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');

  // Mode: 'INCLUDE_ME' (chia đều cả tôi), 'FRIENDS_ONLY' (chia đều cho bạn bè)
  const [splitMode, setSplitMode] = useState<'INCLUDE_ME' | 'FRIENDS_ONLY'>('INCLUDE_ME');

  // Friends state
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<number | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const res: any = await friendshipService.getFriends();
      if (res && res.success) {
        setFriends(res.data || []);
      }
    } catch (error) {
      console.log('Error loading friends for split bill:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleAmountChange = (text: string) => {
    let numeric = text.replace(/[^0-9]/g, '');
    numeric = numeric.replace(/^0+/, '');
    if (!numeric) {
      setAmountStr('');
      return;
    }
    const formatted = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setAmountStr(formatted);
  };

  const toggleSelectFriend = (friendId: number) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const selectAllFriends = () => {
    if (selectedFriendIds.length === filteredFriends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(filteredFriends.map((f) => f.friendId));
    }
  };

  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends;
    const query = friendSearch.toLowerCase();
    return friends.filter(
      (f) =>
        f.friendUsername.toLowerCase().includes(query) ||
        f.friendEmail.toLowerCase().includes(query)
    );
  }, [friends, friendSearch]);

  // Calculations
  const numericTotalAmount = useMemo(() => {
    const raw = amountStr.replace(/\./g, '');
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : val;
  }, [amountStr]);

  const selectedCount = selectedFriendIds.length;

  const perPersonAmount = useMemo(() => {
    if (numericTotalAmount <= 0 || selectedCount === 0) return 0;
    const totalDivisions = splitMode === 'INCLUDE_ME' ? selectedCount + 1 : selectedCount;
    return Math.floor(numericTotalAmount / totalDivisions);
  }, [numericTotalAmount, selectedCount, splitMode]);

  const isAmountValid = perPersonAmount >= 2000;
  const isFormValid =
    title.trim().length > 0 &&
    numericTotalAmount >= 2000 &&
    selectedCount > 0 &&
    isAmountValid &&
    !submitting;
  
  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên khoản chia.');
      setErrorModalVisible(true);
      return;
    }

    if (selectedCount === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 người bạn để chia tiền.');
      setErrorModalVisible(true);
      return;
    }

    if (!isAmountValid) {
      setErrorMessage('Số tiền chia tối thiểu mỗi người là 2.000đ.');
      setErrorModalVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      const membersPayload = selectedFriendIds.map((friendId) => ({
        userId: friendId,
        amount: perPersonAmount,
      }));

      const payload = {
        title: title.trim(),
        totalAmount: numericTotalAmount,
        note: note.trim() || undefined,
        members: membersPayload,
      };

      const res: any = await splitBillService.createSplitBill(payload);

      if (res && res.success) {
        setCreatedBillId(res.data?.id || null);
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(res?.message || 'Không thể tạo yêu cầu chia tiền. Vui lòng thử lại.');
        setErrorModalVisible(true);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Đã xảy ra lỗi khi tạo yêu cầu chia tiền.';
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = () => {
    setSuccessModalVisible(false);
    if (createdBillId) {
      router.replace({
        pathname: '/split-bill/[id]',
        params: { id: createdBillId },
      } as any);
    } else {
      handleGoToList();
    }
  };

  const handleGoToList = () => {
    setSuccessModalVisible(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/split-bill' as any);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[PASTEL_PALETTE.headerStart, PASTEL_PALETTE.headerMid, PASTEL_PALETTE.headerEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerDecorCircleLarge} />
          <View style={styles.headerDecorCircleSmall} />

          <View style={styles.headerTopRow}>
            <View style={styles.leftSection}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back-outline" size={24} color={PASTEL_PALETTE.subtitle} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Tạo yêu cầu chia tiền
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card 1: Thông tin khoản chi */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Thông tin khoản chi</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên khoản chi <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Tiền ăn tối, Tiền cafe, Tiền phòng..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={PASTEL_PALETTE.textMuted}
              maxLength={60}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tổng số tiền hóa đơn <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                value={amountStr}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholderTextColor={PASTEL_PALETTE.textMuted}
              />
              <Text style={styles.currencySuffix}>đ</Text>
            </View>
          </View>

          <View style={[styles.inputGroup, { marginBottom: 12 }]}>
            <Text style={styles.label}>Ghi chú / Lời nhắn</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lời nhắn cho bạn bè..."
              value={note}
              onChangeText={setNote}
              placeholderTextColor={PASTEL_PALETTE.textMuted}
              maxLength={100}
            />
          </View>

        </View>

        {/* Card 2: Chọn bạn bè */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
              2. Chọn bạn bè ({selectedCount}/{friends.length})
            </Text>
            {friends.length > 0 && (
              <TouchableOpacity onPress={selectAllFriends} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: PASTEL_PALETTE.accentDeep, fontWeight: '700' }}>
                  {selectedFriendIds.length === filteredFriends.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search bar */}
          <View style={styles.searchFriendInput}>
            <Ionicons name="search-outline" size={18} color={PASTEL_PALETTE.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: PASTEL_PALETTE.title }}
              placeholder="Tìm kiếm bạn bè theo tên..."
              value={friendSearch}
              onChangeText={setFriendSearch}
              placeholderTextColor={PASTEL_PALETTE.textMuted}
            />
          </View>

          {loadingFriends ? (
            <ActivityIndicator style={{ paddingVertical: 20 }} color={PASTEL_PALETTE.accentDeep} />
          ) : filteredFriends.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={36} color={PASTEL_PALETTE.textMuted} />
              <Text style={{ color: PASTEL_PALETTE.textMuted, fontSize: 14, marginTop: 8 }}>
                {friends.length === 0 ? 'Bạn chưa có bạn bè nào để chia tiền' : 'Không tìm thấy bạn bè phù hợp'}
              </Text>
            </View>
          ) : (
            <View style={styles.friendListWrap}>
              {filteredFriends.map((friend) => {
                const isSelected = selectedFriendIds.includes(friend.friendId);
                const initial = friend.friendUsername ? friend.friendUsername.charAt(0).toUpperCase() : 'U';
                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={[styles.friendItem, isSelected ? styles.friendItemSelected : null]}
                    onPress={() => toggleSelectFriend(friend.friendId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.friendAvatarCircle}>
                      <Text style={styles.friendAvatarText}>{initial}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName} numberOfLines={1}>
                        {friend.friendUsername}
                      </Text>
                      <Text style={styles.friendEmail} numberOfLines={1}>
                        {friend.friendEmail}
                      </Text>
                    </View>
                    <View style={[styles.friendCheckbox, isSelected ? styles.friendCheckboxSelected : null]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Card 3: Phương thức chia & Tổng kết */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Phương thức chia tiền</Text>

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeBtn, splitMode === 'INCLUDE_ME' ? styles.modeBtnActive : null]}
              onPress={() => setSplitMode('INCLUDE_ME')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeBtnText, splitMode === 'INCLUDE_ME' ? styles.modeBtnTextActive : null]}>
                Chia đều (Bao gồm tôi)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, splitMode === 'FRIENDS_ONLY' ? styles.modeBtnActive : null]}
              onPress={() => setSplitMode('FRIENDS_ONLY')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeBtnText, splitMode === 'FRIENDS_ONLY' ? styles.modeBtnTextActive : null]}>
                Chia đều (Chỉ bạn bè)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng hóa đơn:</Text>
              <Text style={styles.summaryValue}>
                {numericTotalAmount > 0 ? `${numericTotalAmount.toLocaleString('vi-VN')}đ` : '0đ'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Số người cùng chia:
              </Text>
              <Text style={styles.summaryValue}>
                {splitMode === 'INCLUDE_ME'
                  ? `${selectedCount + 1} người (Tôi + ${selectedCount} bạn)`
                  : `${selectedCount} người`}
              </Text>
            </View>

            <View style={[styles.summaryRow, { marginBottom: 0, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#DDD6FE' }]}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', color: PASTEL_PALETTE.title }]}>
                Mỗi người cần trả:
              </Text>
              <Text style={styles.perPersonHighlight}>
                {perPersonAmount > 0 ? `${perPersonAmount.toLocaleString('vi-VN')}đ` : '0đ'}
              </Text>
            </View>
          </View>

          {/* Condition Warning */}
          {selectedCount > 0 && numericTotalAmount > 0 && !isAmountValid && (
            <View style={styles.warningBadge}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.warningText}>
                Số tiền chia cho mỗi người phải từ 2.000đ trở lên.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backBtnFooter}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtnFooter, !isFormValid ? { opacity: 0.5 } : null]}
          onPress={handleSubmit}
          disabled={!isFormValid}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Gửi yêu cầu chia tiền</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ConfirmModal
        visible={errorModalVisible}
        title="Thông báo"
        message={errorMessage}
        iconName="alert-circle"
        iconColor="#EF4444"
        confirmText="Đã hiểu"
        hideCancel={true}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />

      <ConfirmModal
        visible={successModalVisible}
        title="Gửi yêu cầu thành công!"
        message={`Đã gửi yêu cầu chia tiền '${title}' đến ${selectedCount} người bạn. Hệ thống đã gửi thông báo chuông và email qua Gmail cho bạn bè.`}
        iconName="checkmark-circle"
        iconColor="#EC4899"
        confirmText="Xem chi tiết"
        cancelText="Về danh sách"
        hideCancel={false}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={handleViewDetail}
        onCancel={handleGoToList}
      />


    </KeyboardAvoidingView>
  );
};

export default CreateSplitBillScreen;
