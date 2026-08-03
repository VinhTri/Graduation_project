import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PastelHeaderShell, { PASTEL_PALETTE } from '@/shared/components/PastelHeaderShell/PastelHeaderShell';
import { splitBillService, SplitBillDetail } from '@/shared/api/services/splitBillService';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';
import PinModal from '@/shared/components/PinModal/PinModal';
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal';
import { styles } from './SplitBillDetailScreen.styles';
import { useTheme, useLanguage } from '@/shared/contexts/ThemeLanguageContext';

export const SplitBillDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { id } = useLocalSearchParams();
  const billId = typeof id === 'string' ? parseInt(id, 10) : Number(id);

  const [bill, setBill] = useState<SplitBillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment states
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  // Modals
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Remind loading
  const [remindingUserId, setRemindingUserId] = useState<number | null>(null);

  const loadBillDetail = useCallback(async () => {
    if (!billId || isNaN(billId)) return;
    try {
      const res: any = await splitBillService.getSplitBillDetail(billId);
      if (res && res.success) {
        setBill(res.data);
      }
    } catch (error) {
      console.log('Error loading bill detail:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [billId]);

  useEffect(() => {
    loadBillDetail();
  }, [loadBillDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBillDetail();
  };

  const handlePay = () => {
    setPinError('');
    setIsPinModalVisible(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!bill) return;
    try {
      setPinLoading(true);
      setPinError('');

      const res: any = await splitBillService.paySplitBill(bill.id, { pinCode: pin });
      if (res && res.success) {
        setIsPinModalVisible(false);
        setSuccessMessage(isEn ? 'Split bill paid successfully!' : 'Thanh toán đợt chia tiền thành công!');
        setSuccessModalVisible(true);
        loadBillDetail();
      } else {
        setPinError(res?.message || (isEn ? 'Incorrect PIN code.' : 'Mã PIN không chính xác.'));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || (isEn ? 'Incorrect PIN code or insufficient balance.' : 'Mã PIN không đúng hoặc số dư không đủ.');
      setPinError(msg);
    } finally {
      setPinLoading(false);
    }
  };

  const handleCancelBill = async () => {
    if (!bill) return;
    try {
      setCancelling(true);
      const res: any = await splitBillService.cancelSplitBill(bill.id);
      if (res && res.success) {
        setCancelModalVisible(false);
        setSuccessMessage(isEn ? 'Split bill cancelled successfully!' : 'Đã hủy đợt chia tiền thành công!');
        setSuccessModalVisible(true);
        loadBillDetail();
      } else {
        setCancelModalVisible(false);
        setErrorMessage(res?.message || (isEn ? 'Could not cancel split bill.' : 'Không thể hủy đợt chia tiền.'));
        setErrorModalVisible(true);
      }
    } catch (err: any) {
      setCancelModalVisible(false);
      const msg = err?.response?.data?.message || err?.message || (isEn ? 'Could not cancel split bill.' : 'Có lỗi xảy ra khi hủy đợt chia tiền.');
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setCancelling(false);
    }
  };

  const handleRemindMember = async (userId: number, memberName: string) => {
    if (!bill) return;
    try {
      setRemindingUserId(userId);
      const res: any = await splitBillService.remindMember(bill.id, userId);
      if (res && res.success) {
        setSuccessMessage(isEn ? `Reminder sent to ${memberName}` : `Đã gửi lời nhắc đến ${memberName}`);
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(res?.message || (isEn ? 'Could not send reminder.' : 'Không thể gửi nhắc nhở.'));
        setErrorModalVisible(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || (isEn ? 'Could not send reminder.' : 'Chưa thể gửi nhắc nhở lúc này.');
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setRemindingUserId(null);
    }
  };

  const getInitialLetter = (name?: string | null) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord.charAt(0).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(
        d.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{isEn ? 'Split bill detail not found.' : 'Không tìm thấy thông tin đợt chia tiền.'}</Text>
        <TouchableOpacity style={[styles.backBtnSolid, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnSolidText}>{isEn ? 'Go back' : 'Quay lại'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreator = bill.creator;
  const isMyStatusPending = bill.myStatus === 'PENDING';
  const isBillCancelled = bill.status === 'CANCELLED';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? theme.textPrimary : '#7C3AED'} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.isDark ? theme.textPrimary : PASTEL_PALETTE.title }]} numberOfLines={1}>
              {bill.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : PASTEL_PALETTE.subtitle }]}>
              {isEn ? 'Created by ' : 'Tạo bởi '}{bill.creatorUsername}
            </Text>
          </View>

          {isCreator && bill.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.cancelBillHeaderBtn}
              onPress={() => setCancelModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBillHeaderBtnText}>{isEn ? 'Cancel' : 'Hủy đợt chia'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </PastelHeaderShell>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Card 1: Overview Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={styles.summaryBadgeRow}>
            <View style={[styles.statusTag, { backgroundColor: isBillCancelled ? '#FEE2E2' : (bill.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7') }]}>
              <Text style={[styles.statusTagText, { color: isBillCancelled ? '#EF4444' : (bill.status === 'COMPLETED' ? '#10B981' : '#D97706') }]}>
                {isBillCancelled ? (isEn ? 'Cancelled' : 'Đã hủy') : (bill.status === 'COMPLETED' ? (isEn ? 'Completed' : 'Đã hoàn tất') : (isEn ? 'In Progress' : 'Đang tiến hành'))}
              </Text>
            </View>
            <Text style={[styles.createdAtText, { color: theme.textMuted }]}>{formatDate(bill.createdAt)}</Text>
          </View>

          <Text style={[styles.totalAmountLabel, { color: theme.textSecondary }]}>{isEn ? 'Total Bill Amount' : 'Tổng số tiền hóa đơn'}</Text>
          <Text style={[styles.totalAmountValue, { color: theme.textPrimary }]}>{(bill.totalAmount || 0).toLocaleString('vi-VN')}đ</Text>

          {bill.note ? (
            <View style={[styles.noteBox, { backgroundColor: theme.bgSoft }]}>
              <Ionicons name="document-text-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>{bill.note}</Text>
            </View>
          ) : null}

          {/* If I am a member to pay */}
          {!isCreator && isMyStatusPending && !isBillCancelled && (
            <View style={[styles.myPayBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
              <View>
                <Text style={[styles.myPayLabel, { color: theme.textSecondary }]}>{isEn ? 'Your amount to pay:' : 'Số tiền bạn cần trả:'}</Text>
                <Text style={[styles.myPayAmount, { color: theme.primary }]}>{(bill.myAmount || 0).toLocaleString('vi-VN')}đ</Text>
              </View>

              <TouchableOpacity style={[styles.payNowBtn, { backgroundColor: theme.primary }]} onPress={handlePay} activeOpacity={0.85}>
                <Text style={styles.payNowBtnText}>{isEn ? 'Pay Now' : 'Thanh toán ngay'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isCreator && bill.myStatus === 'PAID' && (
            <View style={[styles.myPaidBox, { backgroundColor: theme.isDark ? theme.bgSoft : '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.myPaidText}>{isEn ? 'You have paid your portion' : 'Bạn đã thanh toán khoản chia này'}</Text>
            </View>
          )}
        </View>

        {/* Card 2: Members List */}
        <View style={[styles.membersCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={styles.membersHeaderRow}>
            <Text style={[styles.membersCardTitle, { color: theme.textPrimary }]}>
              {isEn ? 'Members (' : 'Danh sách thành viên ('}{bill.members.length})
            </Text>
            <Text style={[styles.membersPaidRatio, { color: theme.primary }]}>
              {(bill.totalPaidAmount || 0).toLocaleString('vi-VN')}đ / {(bill.totalAmount || 0).toLocaleString('vi-VN')}đ
            </Text>
          </View>

          <View style={styles.membersList}>
            {bill.members.map((member) => {
              const isPaid = member.status === 'PAID';

              return (
                <View key={member.id} style={[styles.memberRow, { borderBottomColor: theme.divider }]}>
                  <View style={[styles.memberAvatarCircle, { backgroundColor: theme.primarySoft }]}>
                    {member.avatarUrl ? (
                      <Image source={{ uri: resolveMediaUrl(member.avatarUrl) || '' }} style={styles.memberAvatarImage} />
                    ) : (
                      <Text style={[styles.memberAvatarText, { color: theme.primary }]}>{getInitialLetter(member.username)}</Text>
                    )}
                  </View>

                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberName, { color: theme.textPrimary }]}>{member.username}</Text>
                      {member.userId === bill.creatorId && (
                        <View style={[styles.creatorBadge, { backgroundColor: theme.primarySoft }]}>
                          <Text style={[styles.creatorBadgeText, { color: theme.primary }]}>{isEn ? 'Creator' : 'Người tạo'}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.memberAmountText, { color: theme.textSecondary }]}>
                      {(member.amount || 0).toLocaleString('vi-VN')}đ
                    </Text>
                  </View>

                  <View style={styles.memberStatusCol}>
                    {isPaid ? (
                      <View style={styles.paidStatusBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.paidStatusText}>{isEn ? 'Paid' : 'Đã trả'}</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={styles.pendingStatusText}>{isEn ? 'Unpaid' : 'Chưa trả'}</Text>
                        {isCreator && !isBillCancelled && member.userId !== bill.creatorId && (
                          <TouchableOpacity
                            style={[styles.remindBtn, { borderColor: theme.primary }]}
                            onPress={() => handleRemindMember(member.userId, member.username)}
                            disabled={remindingUserId === member.userId}
                            activeOpacity={0.7}
                          >
                            {remindingUserId === member.userId ? (
                              <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                              <Text style={[styles.remindBtnText, { color: theme.primary }]}>{isEn ? 'Remind' : 'Nhắc nhở'}</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Pin Modal for Payment */}
      <PinModal
        visible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
        onConfirm={handlePinSubmit}
        errorMessage={pinError}
        title={isEn ? "Confirm Payment" : "Xác nhận thanh toán"}
        subtitle={isEn ? `Enter PIN to pay ${(bill?.myAmount || 0).toLocaleString('vi-VN')}đ` : `Nhập mã PIN để thanh toán ${(bill?.myAmount || 0).toLocaleString('vi-VN')}đ`}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        visible={cancelModalVisible}
        title={isEn ? "Cancel Split Bill?" : "Hủy đợt chia tiền?"}
        message={isEn ? "Are you sure you want to cancel this split bill request?" : "Bạn có chắc chắn muốn hủy đợt chia tiền này? Hành động này không thể hoàn tác."}
        iconName="trash"
        iconColor="#EF4444"
        confirmText={isEn ? "Cancel Bill" : "Hủy đợt chia"}
        cancelText={isEn ? "Go back" : "Quay lại"}
        confirmButtonColor="#EF4444"
        onConfirm={handleCancelBill}
        onCancel={() => setCancelModalVisible(false)}
      />

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
        title={isEn ? "Success!" : "Thành công!"}
        message={successMessage}
        iconName="checkmark-circle"
        iconColor="#10B981"
        confirmText={isEn ? "Understood" : "Đã hiểu"}
        hideCancel={true}
        confirmButtonColor="#10B981"
        onConfirm={() => setSuccessModalVisible(false)}
        onCancel={() => setSuccessModalVisible(false)}
      />
    </View>
  );
};

export default SplitBillDetailScreen;
