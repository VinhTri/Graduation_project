import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PastelHeaderShell, { PASTEL_PALETTE } from '@/shared/components/PastelHeaderShell/PastelHeaderShell';
import { splitBillService, SplitBillDetail } from '@/shared/api/services/splitBillService';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';
import { EmptyBoxIllustration } from '../../components/EmptyBoxIllustration';
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal';
import { styles } from './SplitBillListScreen.styles';
import { useTheme, useLanguage } from '@/shared/contexts/ThemeLanguageContext';

export const SplitBillListScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [bills, setBills] = useState<SplitBillDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem('userName').then((name) => {
      if (name) setCurrentUserName(name);
    });
    AsyncStorage.getItem('userAvatarUrl').then((avatar) => {
      if (avatar) setCurrentUserAvatar(avatar);
    });
  }, []);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalMessage, setInfoModalMessage] = useState('');

  const loadBills = useCallback(async () => {
    try {
      const res: any = await splitBillService.getMySplitBills();
      if (res && res.success) {
        setBills(res.data || []);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.log('Error loading split bills:', error);
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [loadBills])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  const pendingPayBills = useMemo(() => {
    return bills.filter(
      (b) => !b.creator && b.myStatus === 'PENDING' && b.status !== 'CANCELLED'
    );
  }, [bills]);

  const pendingCollectBills = useMemo(() => {
    return bills.filter((b) => b.creator && b.status === 'PENDING');
  }, [bills]);

  const completedPayBills = useMemo(() => {
    return bills.filter(
      (b) => !b.creator && (b.myStatus === 'PAID' || b.status === 'COMPLETED' || b.status === 'CANCELLED')
    );
  }, [bills]);

  const completedCollectBills = useMemo(() => {
    return bills.filter(
      (b) => b.creator && (b.status === 'COMPLETED' || b.status === 'CANCELLED')
    );
  }, [bills]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getInitialLetter = (name?: string | null) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord.charAt(0).toUpperCase();
  };

  const handleRemindAll = async (bill: SplitBillDetail) => {
    const pendingMembers = bill.members.filter((m) => m.status === 'PENDING');
    if (pendingMembers.length === 0) {
      setInfoModalTitle(isEn ? 'Notification' : 'Thông báo');
      setInfoModalMessage(isEn ? 'All friends in this bill have paid!' : 'Tất cả bạn bè trong khoản chia này đã thanh toán đủ!');
      setInfoModalVisible(true);
      return;
    }

    try {
      let remindedCount = 0;
      let lastErrMsg = '';
      for (const m of pendingMembers) {
        try {
          await splitBillService.remindMember(bill.id, m.userId);
          remindedCount++;
        } catch (err: any) {
          lastErrMsg = err?.response?.data?.message || err?.message || '';
        }
      }

      if (remindedCount > 0) {
        setInfoModalTitle(isEn ? 'Reminder Sent' : 'Đã gửi lời nhắc');
        setInfoModalMessage(isEn ? `Sent reminders to ${remindedCount} friends.` : `Đã gửi lời nhắc qua Email & Chuông thông báo đến ${remindedCount} bạn bè.`);
        setInfoModalVisible(true);
      } else {
        setInfoModalTitle(isEn ? 'Cannot Send Reminder' : 'Chưa thể gửi nhắc nhở');
        setInfoModalMessage(lastErrMsg || (isEn ? 'Please wait before reminding again.' : 'Úi, bạn vừa nhắc nhở đây mà. Hãy đợi sau 12h nữa nha'));
        setInfoModalVisible(true);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || (isEn ? 'Could not send reminder now.' : 'Không thể gửi nhắc nhở lúc này.');
      setInfoModalTitle(isEn ? 'Notification' : 'Thông báo');
      setInfoModalMessage(msg);
      setInfoModalVisible(true);
    }
  };

  const isPendingTabEmpty = pendingPayBills.length === 0 && pendingCollectBills.length === 0;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? theme.textPrimary : '#7C3AED'} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.isDark ? theme.textPrimary : PASTEL_PALETTE.title }]}>
                {isEn ? 'Split Bill' : 'Chia tiền'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : PASTEL_PALETTE.subtitle }]}>
                {isEn ? 'Manage payables & receivables' : 'Quản lý khoản cần trả / cần thu'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.isDark ? theme.primary : PASTEL_PALETTE.accentDeep }]}
            onPress={() => router.push('/split-bill/create' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.addButtonText}>{isEn ? 'New' : 'Tạo mới'}</Text>
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isEn ? 'Payables & Receivables' : 'Quản lý khoản cần trả/cần thu'}
        </Text>

        <View style={[styles.mainCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          {/* Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: theme.divider }]}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'PENDING' && styles.tabItemActive]}
              onPress={() => setActiveTab('PENDING')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'PENDING' && { color: theme.primary, fontWeight: '700' }]}>
                {isEn ? 'Pending' : 'Đang chờ'}
              </Text>
              {activeTab === 'PENDING' && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'COMPLETED' && styles.tabItemActive]}
              onPress={() => setActiveTab('COMPLETED')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'COMPLETED' && { color: theme.primary, fontWeight: '700' }]}>
                {isEn ? 'Completed' : 'Đã xong'}
              </Text>
              {activeTab === 'COMPLETED' && <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ paddingVertical: 50 }} color={theme.primary} />
          ) : activeTab === 'PENDING' ? (
            isPendingTabEmpty ? (
              <View style={styles.emptyIllustrationWrap}>
                <EmptyBoxIllustration />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'All bill split requests are completed' : 'Tất cả các lời nhắc đã được hoàn thành'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  {isEn ? 'Past split bills can be viewed in Completed tab' : 'Bạn có thể xem lại các lời nhắc trong quá khứ ở phần "Đã xong"'}
                </Text>
              </View>
            ) : (
              <View>
                {/* 1. Cần trả */}
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  {isEn ? 'To Pay ' : 'Cần trả '}{pendingPayBills.length > 0 ? `(${pendingPayBills.length})` : ''}
                </Text>
                {pendingPayBills.length === 0 ? (
                  <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
                    {isEn ? 'No payables' : 'Không có khoản nào cần trả'}
                  </Text>
                ) : (
                  pendingPayBills.map((bill) => (
                    <TouchableOpacity
                      key={bill.id}
                      style={[styles.billCard, { backgroundColor: theme.isDark ? theme.bgSoft : '#FFF5F8', borderColor: theme.cardBorder }]}
                      onPress={() =>
                        router.push({
                          pathname: '/split-bill/[id]',
                          params: { id: bill.id },
                        } as any)
                      }
                      activeOpacity={0.85}
                    >
                      <View style={styles.billCardTopRow}>
                        <View style={styles.billCardTopLeft}>
                          <View style={[styles.tagPill, { backgroundColor: theme.primarySoft }]}>
                            <MaterialCommunityIcons name="account-cash-outline" size={13} color={theme.primary} />
                            <Text style={[styles.tagPillText, { color: theme.primary }]}>{isEn ? 'Split Bill' : 'Chia tiền'}</Text>
                          </View>
                          <Text style={[styles.billTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                            {bill.title}
                          </Text>
                        </View>
                        <Text style={[styles.billDateText, { color: theme.textMuted }]}>{formatDate(bill.createdAt)}</Text>
                      </View>

                      <View style={styles.billMainRow}>
                        <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
                          {bill.creatorAvatarUrl ? (
                            <Image
                              source={{ uri: resolveMediaUrl(bill.creatorAvatarUrl) || '' }}
                              style={styles.avatarImage}
                            />
                          ) : (
                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                              {getInitialLetter(bill.creatorUsername)}
                            </Text>
                          )}
                        </View>

                        <View style={styles.billMiddleCol}>
                          <Text style={[styles.billLabel, { color: theme.textSecondary }]}>{isEn ? 'Pay to ' : 'Cần trả '}{bill.creatorUsername}</Text>
                          <Text style={[styles.billAmountText, { color: theme.textSecondary }]}>
                            {isEn ? 'Amount: ' : 'Số tiền: '}<Text style={[styles.billAmountBold, { color: theme.primary }]}>{(bill.myAmount || 0).toLocaleString('vi-VN')}đ</Text>
                          </Text>
                        </View>

                        <View style={styles.billRightCol}>
                          <Text style={styles.statusTextOrange}>{isEn ? 'Unpaid' : 'Chưa thanh toán'}</Text>
                          <TouchableOpacity
                            style={[styles.paySolidBtn, { backgroundColor: theme.primary }]}
                            onPress={() =>
                              router.push({
                                pathname: '/split-bill/[id]',
                                params: { id: bill.id },
                              } as any)
                            }
                            activeOpacity={0.8}
                          >
                            <Text style={styles.paySolidBtnText}>{isEn ? 'Pay Now' : 'Thanh toán'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}

                <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />

                {/* 2. Cần thu */}
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  {isEn ? 'To Collect ' : 'Cần thu '}{pendingCollectBills.length > 0 ? `(${pendingCollectBills.length})` : ''}
                </Text>
                {pendingCollectBills.length === 0 ? (
                  <Text style={[styles.emptySectionText, { color: theme.textMuted }]}>
                    {isEn ? 'No receivables' : 'Không có khoản nào cần thu'}
                  </Text>
                ) : (
                  pendingCollectBills.map((bill) => {
                    const totalAmount = bill.totalAmount || 0;
                    const paidAmount = bill.totalPaidAmount || 0;
                    const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
                    const isPartiallyPaid = paidAmount > 0;

                    return (
                      <TouchableOpacity
                        key={bill.id}
                        style={[styles.billCard, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}
                        onPress={() =>
                          router.push({
                            pathname: '/split-bill/[id]',
                            params: { id: bill.id },
                          } as any)
                        }
                        activeOpacity={0.85}
                      >
                        <View style={styles.billCardTopRow}>
                          <View style={styles.billCardTopLeft}>
                            <View style={[styles.tagPill, { backgroundColor: theme.primarySoft }]}>
                              <MaterialCommunityIcons name="account-cash-outline" size={13} color={theme.primary} />
                              <Text style={[styles.tagPillText, { color: theme.primary }]}>{isEn ? 'Split Bill' : 'Chia tiền'}</Text>
                            </View>
                            <Text style={[styles.billTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                              {bill.title}
                            </Text>
                          </View>
                          <Text style={[styles.billDateText, { color: theme.textMuted }]}>{formatDate(bill.createdAt)}</Text>
                        </View>

                        <View style={styles.billMainRow}>
                          <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
                            {currentUserAvatar || bill.creatorAvatarUrl ? (
                              <Image
                                source={{ uri: resolveMediaUrl(currentUserAvatar || bill.creatorAvatarUrl) || '' }}
                                style={styles.avatarImage}
                              />
                            ) : (
                              <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {getInitialLetter(currentUserName || bill.creatorUsername)}
                              </Text>
                            )}
                          </View>

                          <View style={styles.billMiddleCol}>
                            <Text style={[styles.billLabel, { color: theme.textSecondary }]}>{isEn ? 'Total Receivable' : 'Tổng cần thu'}</Text>
                            <Text style={[styles.billAmountText, { color: theme.textSecondary }]}>
                              {isEn ? 'Received ' : 'Nhận '}<Text style={[styles.billAmountBold, { color: theme.textPrimary }]}>{paidAmount.toLocaleString('vi-VN')}đ</Text> / {totalAmount.toLocaleString('vi-VN')}đ
                            </Text>
                            <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
                              <View style={[styles.progressBar, { width: `${percent}%`, backgroundColor: theme.primary }]} />
                            </View>
                          </View>

                          <View style={styles.billRightCol}>
                            <Text style={styles.statusTextOrange}>
                              {isPartiallyPaid ? (isEn ? 'Partial Paid' : 'Đã nhận một phần') : (isEn ? 'Uncollected' : 'Chưa nhận')}
                            </Text>
                            <TouchableOpacity
                              style={[styles.remindOutlineBtn, { borderColor: theme.primary }]}
                              onPress={() => handleRemindAll(bill)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.remindOutlineBtnText, { color: theme.primary }]}>{isEn ? 'Remind' : 'Nhắc nhở'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )
          ) : (
            /* TAB: ĐÃ XONG */
            <View>
              {completedPayBills.length === 0 && completedCollectBills.length === 0 ? (
                <View style={styles.emptyIllustrationWrap}>
                  <Ionicons name="checkmark-done-circle-outline" size={54} color={theme.textMuted} />
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{isEn ? 'No completed split bills' : 'Chưa có khoản chia tiền nào đã hoàn tất'}</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    {isEn ? 'Paid or cancelled split bills will be listed here.' : 'Các yêu cầu chia tiền đã thanh toán đủ hoặc đã hủy sẽ hiển thị tại đây.'}
                  </Text>
                </View>
              ) : (
                <View>
                  {completedPayBills.length > 0 && (
                    <View>
                      <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>{isEn ? 'Paid Bills (' : 'Khoản tôi đã trả ('}{completedPayBills.length})</Text>
                      {completedPayBills.map((bill) => (
                        <TouchableOpacity
                          key={bill.id}
                          style={[styles.billCard, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}
                          onPress={() =>
                            router.push({
                              pathname: '/split-bill/[id]',
                              params: { id: bill.id },
                            } as any)
                          }
                          activeOpacity={0.85}
                        >
                          <View style={styles.billCardTopRow}>
                            <View style={styles.billCardTopLeft}>
                              <View style={[styles.tagPill, { backgroundColor: theme.primarySoft }]}>
                                <MaterialCommunityIcons name="account-cash-outline" size={13} color={theme.primary} />
                                <Text style={[styles.tagPillText, { color: theme.primary }]}>{isEn ? 'Split Bill' : 'Chia tiền'}</Text>
                              </View>
                              <Text style={[styles.billTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                                {bill.title}
                              </Text>
                            </View>
                            <Text style={[styles.billDateText, { color: theme.textMuted }]}>{formatDate(bill.createdAt)}</Text>
                          </View>

                          <View style={styles.billMainRow}>
                            <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
                              {bill.creatorAvatarUrl ? (
                                <Image
                                  source={{ uri: resolveMediaUrl(bill.creatorAvatarUrl) || '' }}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <Text style={[styles.avatarText, { color: theme.primary }]}>
                                  {getInitialLetter(bill.creatorUsername)}
                                </Text>
                              )}
                            </View>
                            <View style={styles.billMiddleCol}>
                              <Text style={[styles.billLabel, { color: theme.textSecondary }]}>{isEn ? 'Paid to ' : 'Đã trả '}{bill.creatorUsername}</Text>
                              <Text style={[styles.billAmountText, { color: theme.textSecondary }]}>
                                {isEn ? 'Amount: ' : 'Số tiền: '}<Text style={[styles.billAmountBold, { color: theme.textPrimary }]}>{(bill.myAmount || 0).toLocaleString('vi-VN')}đ</Text>
                              </Text>
                            </View>
                            <View style={styles.billRightCol}>
                              <Text style={styles.statusTextGreen}>
                                {bill.status === 'CANCELLED' ? (isEn ? 'Cancelled' : 'Đã hủy') : (isEn ? 'Paid' : 'Đã trả')}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                      <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />
                    </View>
                  )}

                  {completedCollectBills.length > 0 && (
                    <View>
                      <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>{isEn ? 'Collected Bills (' : 'Khoản tôi đã thu ('}{completedCollectBills.length})</Text>
                      {completedCollectBills.map((bill) => (
                        <TouchableOpacity
                          key={bill.id}
                          style={[styles.billCard, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}
                          onPress={() =>
                            router.push({
                              pathname: '/split-bill/[id]',
                              params: { id: bill.id },
                            } as any)
                          }
                          activeOpacity={0.85}
                        >
                          <View style={styles.billCardTopRow}>
                            <View style={styles.billCardTopLeft}>
                              <View style={[styles.tagPill, { backgroundColor: theme.primarySoft }]}>
                                <MaterialCommunityIcons name="account-cash-outline" size={13} color={theme.primary} />
                                <Text style={[styles.tagPillText, { color: theme.primary }]}>{isEn ? 'Split Bill' : 'Chia tiền'}</Text>
                              </View>
                              <Text style={[styles.billTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                                {bill.title}
                              </Text>
                            </View>
                            <Text style={[styles.billDateText, { color: theme.textMuted }]}>{formatDate(bill.createdAt)}</Text>
                          </View>

                          <View style={styles.billMainRow}>
                            <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
                              {currentUserAvatar || bill.creatorAvatarUrl ? (
                                <Image
                                  source={{ uri: resolveMediaUrl(currentUserAvatar || bill.creatorAvatarUrl) || '' }}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <Text style={[styles.avatarText, { color: theme.primary }]}>
                                  {getInitialLetter(currentUserName || bill.creatorUsername)}
                                </Text>
                              )}
                            </View>
                            <View style={styles.billMiddleCol}>
                              <Text style={[styles.billLabel, { color: theme.textSecondary }]}>{isEn ? 'Total Collected' : 'Tổng đã thu'}</Text>
                              <Text style={[styles.billAmountText, { color: theme.textSecondary }]}>
                                <Text style={[styles.billAmountBold, { color: theme.textPrimary }]}>{(bill.totalPaidAmount || bill.totalAmount).toLocaleString('vi-VN')}đ</Text>
                              </Text>
                            </View>
                            <View style={styles.billRightCol}>
                              <Text style={bill.status === 'CANCELLED' ? styles.statusTextMuted : styles.statusTextGreen}>
                                {bill.status === 'CANCELLED' ? (isEn ? 'Cancelled' : 'Đã hủy') : (isEn ? 'Completed' : 'Đã hoàn tất')}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={infoModalVisible}
        title={infoModalTitle}
        message={infoModalMessage}
        iconName="information-circle"
        iconColor={theme.primary}
        confirmText={isEn ? "Understood" : "Đã hiểu"}
        hideCancel={true}
        confirmButtonColor={theme.primary}
        onConfirm={() => setInfoModalVisible(false)}
        onCancel={() => setInfoModalVisible(false)}
      />
    </View>
  );
};

export default SplitBillListScreen;
