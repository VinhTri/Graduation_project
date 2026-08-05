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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { splitBillService, SplitBillDetail } from '@/shared/api/services/splitBillService';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';
import PinModal from '@/shared/components/PinModal/PinModal';
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal';
import { styles } from './SplitBillDetailScreen.styles';

export const SplitBillDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/split-bill' as any);
    }
  };

  const handleOpenPay = () => {
    setPinError('');
    setIsPinModalVisible(true);
  };

  const handleConfirmPin = async (pin: string) => {
    if (!billId) return;
    try {
      setPinLoading(true);
      setPinError('');

      const res: any = await splitBillService.paySplitBill(billId, { pinCode: pin });

      if (res && res.success) {
        setIsPinModalVisible(false);
        setBill(res.data);
        setSuccessMessage(
          `Bạn đã thanh toán thành công ${(bill?.myAmount || 0).toLocaleString('vi-VN')}đ cho khoản chia '${bill?.title}'.`
        );
        setSuccessModalVisible(true);
      } else {
        setPinError(res?.message || 'Thanh toán thất bại.');
      }
    } catch (error: any) {
      console.log('Error paying split bill:', error);
      const msg =
        error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi khi thanh toán.';
      if (msg.toLowerCase().includes('pin')) {
        setPinError(msg);
      } else {
        setIsPinModalVisible(false);
        setErrorMessage(msg);
        setErrorModalVisible(true);
      }
    } finally {
      setPinLoading(false);
    }
  };

  const handleRemindMember = async (memberUserId: number, memberUsername: string) => {
    if (!billId) return;
    try {
      setRemindingUserId(memberUserId);
      const res: any = await splitBillService.remindMember(billId, memberUserId);
      if (res && res.success) {
        setSuccessMessage(`Đã gửi lời nhắc thanh toán qua Email & Chuông cho ${memberUsername}.`);
        setSuccessModalVisible(true);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Không thể gửi lời nhắc lúc này.';
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setRemindingUserId(null);
    }
  };

  const handleCancelBill = async () => {
    if (!billId) return;
    try {
      setCancelling(true);
      const res: any = await splitBillService.cancelSplitBill(billId);
      if (res && res.success) {
        setCancelModalVisible(false);
        loadBillDetail();
      }
    } catch (error: any) {
      setCancelModalVisible(false);
      const msg = error?.response?.data?.message || error?.message || 'Không thể hủy yêu cầu.';
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') {
      return { text: 'Đã hoàn tất', bg: '#D1FAE5', color: '#059669' };
    }
    if (status === 'CANCELLED') {
      return { text: 'Đã hủy', bg: '#FEE2E2', color: '#DC2626' };
    }
    return { text: 'Đang chia tiền', bg: '#EDE9FE', color: '#7C3AED' };
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={PASTEL_PALETTE.textMuted} />
        <Text style={{ fontSize: 16, color: PASTEL_PALETTE.title, marginTop: 12, fontWeight: '700' }}>
          Không tìm thấy yêu cầu chia tiền
        </Text>
        <TouchableOpacity
          style={[styles.payBtn, { marginTop: 20, paddingHorizontal: 24 }]}
          onPress={handleBack}
        >
          <Text style={styles.payBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const badge = getStatusBadge(bill.status);
  const isPendingMember = !bill.creator && bill.myStatus === 'PENDING' && bill.status !== 'CANCELLED';
  const isPaidMember = !bill.creator && bill.myStatus === 'PAID';
  const progressPercent =
    bill.totalMembersCount > 0
      ? Math.round((bill.paidMembersCount / bill.totalMembersCount) * 100)
      : 0;

  return (
    <View style={styles.safeArea}>
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
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back-outline" size={24} color={PASTEL_PALETTE.subtitle} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Chi tiết chia tiền
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  Mã hóa đơn #{bill.id}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.billTitleRow}>
            <Text style={styles.billTitleText}>{bill.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
            </View>
          </View>

          <Text style={styles.billDateText}>Tạo lúc: {formatDate(bill.createdAt)}</Text>

          <View style={styles.totalAmountSection}>
            <Text style={styles.totalLabel}>Tổng số tiền hóa đơn</Text>
            <Text style={styles.totalValue}>{bill.totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>

          {bill.note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Ghi chú:</Text>
              <Text style={styles.noteText}>{bill.note}</Text>
            </View>
          ) : null}

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Tiến độ thanh toán</Text>
              <Text style={styles.progressCount}>
                {bill.paidMembersCount}/{bill.totalMembersCount} người ({progressPercent}%)
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Creator Card */}
        <View style={styles.creatorCard}>
          <View style={styles.creatorAvatar}>
            {bill.creatorAvatarUrl ? (
              <Image
                source={{ uri: resolveMediaUrl(bill.creatorAvatarUrl) || '' }}
                style={styles.creatorAvatarImage}
              />
            ) : (
              <Text style={styles.creatorAvatarText}>
                {(() => {
                  if (!bill.creatorUsername || !bill.creatorUsername.trim()) return 'U';
                  const parts = bill.creatorUsername.trim().split(/\s+/);
                  return parts[parts.length - 1].charAt(0).toUpperCase();
                })()}
              </Text>
            )}
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorRoleText}>Người tạo yêu cầu</Text>
            <Text style={styles.creatorName}>
              {bill.creator ? `${bill.creatorUsername} (Bạn)` : bill.creatorUsername}
            </Text>
            <Text style={styles.creatorEmail}>{bill.creatorEmail}</Text>
          </View>
        </View>

        {/* Participants List */}
        <View style={styles.membersCard}>
          <Text style={styles.membersTitle}>
            Danh sách người tham gia ({bill.members.length})
          </Text>

          {bill.members.map((member) => {
            const isPaid = member.status === 'PAID';
            const isReminding = remindingUserId === member.userId;
            const parts = (member.username || '').trim().split(/\s+/);
            const initial = parts.length > 0 && parts[0] ? parts[parts.length - 1].charAt(0).toUpperCase() : 'U';

            return (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  {member.avatarUrl ? (
                    <Image
                      source={{ uri: resolveMediaUrl(member.avatarUrl) || '' }}
                      style={styles.memberAvatarImage}
                    />
                  ) : (
                    <Text style={styles.memberAvatarText}>{initial}</Text>
                  )}
                </View>

                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.username}
                  </Text>
                  <Text style={styles.memberSubtext} numberOfLines={1}>
                    {member.email}
                  </Text>
                </View>

                <View style={styles.memberAmountSection}>
                  <Text style={styles.memberAmountText}>
                    {member.amount.toLocaleString('vi-VN')}đ
                  </Text>

                  {isPaid ? (
                    <View style={styles.memberStatusPaid}>
                      <Ionicons name="checkmark-circle" size={13} color="#059669" />
                      <Text style={styles.memberStatusPaidText}>Đã trả</Text>
                    </View>
                  ) : (
                    <View style={styles.memberStatusPending}>
                      <Ionicons name="time" size={13} color="#D97706" />
                      <Text style={styles.memberStatusPendingText}>Chưa trả</Text>
                    </View>
                  )}

                  {/* Nhắc nhở button for Creator */}
                  {bill.creator && !isPaid && bill.status === 'PENDING' && (
                    <TouchableOpacity
                      style={styles.remindBtn}
                      onPress={() => handleRemindMember(member.userId, member.username)}
                      disabled={isReminding}
                      activeOpacity={0.7}
                    >
                      {isReminding ? (
                        <ActivityIndicator size="small" color={PASTEL_PALETTE.accentDeep} />
                      ) : (
                        <>
                          <Ionicons name="notifications-outline" size={12} color={PASTEL_PALETTE.accentDeep} />
                          <Text style={styles.remindBtnText}>Nhắc nhở</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Nút Hủy yêu cầu chia tiền cho người tạo khi bill còn PENDING */}
        {bill.creator && bill.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.cancelBillButton}
            onPress={() => setCancelModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.cancelBillButtonText}>Hủy yêu cầu chia tiền</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Action */}
      {isPendingMember && bill.myAmount != null && (
        <View style={styles.payFooter}>
          <View style={styles.payFooterRow}>
            <Text style={styles.payFooterLabel}>Số tiền bạn cần trả:</Text>
            <Text style={styles.payFooterAmount}>
              {bill.myAmount.toLocaleString('vi-VN')}đ
            </Text>
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={handleOpenPay}
            activeOpacity={0.8}
          >
            <Text style={styles.payBtnText}>Thanh toán ngay bằng ví</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPaidMember && (
        <View style={styles.payFooter}>
          <View style={styles.paidBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.paidBannerText}>
              Bạn đã thanh toán thành công {(bill.myAmount || 0).toLocaleString('vi-VN')}đ cho khoản chia này.
            </Text>
          </View>
        </View>
      )}

      {/* Pin Modal for Payment */}
      <PinModal
        visible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
        onConfirm={handleConfirmPin}
        errorMessage={pinError}
        title="Nhập mã PIN ví"
        subtitle="Vui lòng nhập mã PIN bảo mật để xác nhận thanh toán chia tiền."
      />

      {/* Error Modal */}
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

      {/* Success Modal */}
      <ConfirmModal
        visible={successModalVisible}
        title="Thành công!"
        message={successMessage}
        iconName="checkmark-circle"
        iconColor="#10B981"
        confirmText="Đóng"
        hideCancel={true}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={() => setSuccessModalVisible(false)}
        onCancel={() => setSuccessModalVisible(false)}
      />

      {/* Cancel Confirm Modal */}
      <ConfirmModal
        visible={cancelModalVisible}
        title="Hủy yêu cầu chia tiền"
        message="Bạn có chắc chắn muốn hủy yêu cầu chia tiền này không? Hành động này không thể hoàn tác."
        iconName="trash"
        iconColor="#EF4444"
        confirmText={cancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
        cancelText="Đóng"
        confirmButtonColor="#EF4444"
        onConfirm={handleCancelBill}
        onCancel={() => setCancelModalVisible(false)}
      />
    </View>
  );
};

export default SplitBillDetailScreen;
