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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PastelHeaderShell, { PASTEL_PALETTE } from '@/shared/components/PastelHeaderShell/PastelHeaderShell';
import { friendshipService, FriendshipResponse } from '@/shared/api/services/friendship.service';
import { splitBillService } from '@/shared/api/services/splitBillService';
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal';
import { styles } from './CreateSplitBillScreen.styles';
import { useTheme, useLanguage } from '@/shared/contexts/ThemeLanguageContext';

export const CreateSplitBillScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');

  const [splitMode, setSplitMode] = useState<'INCLUDE_ME' | 'FRIENDS_ONLY'>('INCLUDE_ME');

  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);

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
      setErrorMessage(isEn ? 'Please enter bill title.' : 'Vui lòng nhập tên khoản chia.');
      setErrorModalVisible(true);
      return;
    }

    if (selectedCount === 0) {
      setErrorMessage(isEn ? 'Please select at least 1 friend to split.' : 'Vui lòng chọn ít nhất 1 người bạn để chia tiền.');
      setErrorModalVisible(true);
      return;
    }

    if (!isAmountValid) {
      setErrorMessage(isEn ? 'Minimum split amount per person is 2,000 VND.' : 'Số tiền chia tối thiểu mỗi người là 2.000đ.');
      setErrorModalVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      const membersPayload = selectedFriendIds.map((friendId) => ({
        userId: friendId,
        amount: perPersonAmount,
      }));

      const res: any = await splitBillService.createSplitBill({
        title: title.trim(),
        totalAmount: numericTotalAmount,
        note: note.trim() || undefined,
        members: membersPayload,
      });

      if (res && res.success) {
        setCreatedBillId(res.data?.id || null);
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(res?.message || (isEn ? 'Could not create split bill.' : 'Không thể tạo đợt chia tiền.'));
        setErrorModalVisible(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || (isEn ? 'An error occurred while creating split bill.' : 'Có lỗi xảy ra khi tạo đợt chia tiền.');
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? theme.textPrimary : '#7C3AED'} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.isDark ? theme.textPrimary : PASTEL_PALETTE.title }]}>
              {isEn ? 'New Split Bill' : 'Tạo đợt chia tiền'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : PASTEL_PALETTE.subtitle }]}>
              {isEn ? 'Equal division with friends' : 'Chia đều chi tiêu với bạn bè'}
            </Text>
          </View>
        </View>
      </PastelHeaderShell>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Card 1: Bill Information */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{isEn ? 'Bill Information' : 'Thông tin đợt chia'}</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{isEn ? 'Title *' : 'Tên khoản chia *'}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                placeholder={isEn ? 'e.g. Dinner, Coffee, Travel...' : 'Ví dụ: Ăn tối, Cà phê, Đi phượt...'}
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{isEn ? 'Total Amount (VND) *' : 'Tổng số tiền (đ) *'}</Text>
              <View style={[styles.amountInputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.amountInput, { color: theme.inputText }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={amountStr}
                  onChangeText={handleAmountChange}
                />
                <Text style={[styles.currencySuffix, { color: theme.primary }]}>đ</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{isEn ? 'Note (optional)' : 'Ghi chú (không bắt buộc)'}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                placeholder={isEn ? 'Write additional note...' : 'Ghi chú chi tiết thêm...'}
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {/* Card 2: Split Mode */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{isEn ? 'Split Option' : 'Tùy chọn chia'}</Text>
            <View style={styles.splitModeContainer}>
              <TouchableOpacity
                style={[styles.modeChip, splitMode === 'INCLUDE_ME' && [styles.modeChipActive, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]]}
                onPress={() => setSplitMode('INCLUDE_ME')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={splitMode === 'INCLUDE_ME' ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.modeChipText, { color: theme.textSecondary }, splitMode === 'INCLUDE_ME' && { color: theme.primary, fontWeight: '700' }]}>
                  {isEn ? 'Include me' : 'Chia cả tôi'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeChip, splitMode === 'FRIENDS_ONLY' && [styles.modeChipActive, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]]}
                onPress={() => setSplitMode('FRIENDS_ONLY')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color={splitMode === 'FRIENDS_ONLY' ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.modeChipText, { color: theme.textSecondary }, splitMode === 'FRIENDS_ONLY' && { color: theme.primary, fontWeight: '700' }]}>
                  {isEn ? 'Friends only' : 'Chỉ chia cho bạn'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3: Select Friends */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <View style={styles.friendsHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{isEn ? 'Select Friends ' : 'Chọn bạn bè '}({selectedCount})</Text>
              <TouchableOpacity onPress={selectAllFriends} activeOpacity={0.7}>
                <Text style={[styles.selectAllText, { color: theme.primary }]}>
                  {selectedFriendIds.length === filteredFriends.length && filteredFriends.length > 0
                    ? (isEn ? 'Deselect All' : 'Bỏ chọn tất cả')
                    : (isEn ? 'Select All' : 'Chọn tất cả')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Friend Search Input */}
            <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Ionicons name="search-outline" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.inputText }]}
                placeholder={isEn ? 'Search friend name or email...' : 'Tìm kiếm bạn bè theo tên, email...'}
                placeholderTextColor={theme.textMuted}
                value={friendSearch}
                onChangeText={setFriendSearch}
              />
              {friendSearch.length > 0 && (
                <TouchableOpacity onPress={() => setFriendSearch('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {loadingFriends ? (
              <ActivityIndicator style={{ paddingVertical: 20 }} color={theme.primary} />
            ) : filteredFriends.length === 0 ? (
              <Text style={[styles.emptyFriendsText, { color: theme.textMuted }]}>
                {friendSearch ? (isEn ? 'No matching friends found' : 'Không tìm thấy bạn bè phù hợp') : (isEn ? 'Your friends list is empty' : 'Danh sách bạn bè trống')}
              </Text>
            ) : (
              <View style={styles.friendsList}>
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.friendId);
                  return (
                    <TouchableOpacity
                      key={friend.friendId}
                      style={[
                        styles.friendRow,
                        { backgroundColor: isSelected ? (theme.isDark ? theme.primarySoft : '#FFF0F6') : theme.bgSoft, borderColor: isSelected ? theme.primary : theme.cardBorder },
                      ]}
                      onPress={() => toggleSelectFriend(friend.friendId)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, { borderColor: isSelected ? theme.primary : theme.textMuted, backgroundColor: isSelected ? theme.primary : 'transparent' }]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={[styles.friendName, { color: theme.textPrimary }]}>{friend.friendUsername}</Text>
                        <Text style={[styles.friendEmail, { color: theme.textSecondary }]}>{friend.friendEmail}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Calculation Summary */}
          {numericTotalAmount > 0 && selectedCount > 0 && (
            <View style={[styles.summaryBox, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{isEn ? 'Total Amount:' : 'Tổng số tiền:'}</Text>
                <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>{numericTotalAmount.toLocaleString('vi-VN')}đ</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{isEn ? 'Divided By:' : 'Chia cho:'}</Text>
                <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>
                  {splitMode === 'INCLUDE_ME' ? `${selectedCount} bạn + Tôi` : `${selectedCount} bạn`}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.divider }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabelBold, { color: theme.textPrimary }]}>{isEn ? 'Each Person Pays:' : 'Mỗi người trả:'}</Text>
                <Text style={[styles.summaryAmountHighlight, { color: theme.primary }]}>
                  {perPersonAmount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: isFormValid ? theme.primary : (theme.isDark ? theme.bgSoft : '#CBD5E1') }]}
            onPress={handleSubmit}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{isEn ? 'Create Bill Split' : 'Tạo đợt chia tiền'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <ConfirmModal
        visible={errorModalVisible}
        title={isEn ? "Notification" : "Thông báo"}
        message={errorMessage}
        iconName="alert-circle"
        iconColor="#EF4444"
        confirmText={isEn ? "Understood" : "Đã hiểu"}
        hideCancel={true}
        confirmButtonColor="#EF4444"
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />

      {/* Success Modal */}
      <ConfirmModal
        visible={successModalVisible}
        title={isEn ? "Created Successfully!" : "Tạo đợt chia thành công!"}
        message={isEn ? "Bill split request created. Selected friends have been notified." : "Đợt chia tiền đã được tạo. Bạn bè đã nhận được lời nhắc thanh toán."}
        iconName="checkmark-circle"
        iconColor="#10B981"
        confirmText={isEn ? "View Detail" : "Xem chi tiết"}
        hideCancel={true}
        confirmButtonColor="#10B981"
        onConfirm={() => {
          setSuccessModalVisible(false);
          if (createdBillId) {
            router.replace({
              pathname: '/split-bill/[id]',
              params: { id: createdBillId },
            } as any);
          } else {
            router.replace('/split-bill' as any);
          }
        }}
        onCancel={() => setSuccessModalVisible(false)}
      />
    </View>
  );
};

export default CreateSplitBillScreen;
