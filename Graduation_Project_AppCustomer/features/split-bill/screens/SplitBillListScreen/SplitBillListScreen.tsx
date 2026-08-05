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

export const SplitBillListScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  // Success / Info Toast Modal
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

  // Split bills by status and roles
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

  // Lấy chữ cái đầu của từ cuối trong tên (VD: "Giang" -> "G", "Hương Giang" -> "G", "Hậu" -> "H")
  const getInitialLetter = (name?: string | null) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord.charAt(0).toUpperCase();
  };

  const handleRemindAll = async (bill: SplitBillDetail) => {
    const pendingMembers = bill.members.filter((m) => m.status === 'PENDING');
    if (pendingMembers.length === 0) {
      setInfoModalTitle('Thông báo');
      setInfoModalMessage('Tất cả bạn bè trong khoản chia này đã thanh toán đủ!');
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
        setInfoModalTitle('Đã gửi lời nhắc');
        setInfoModalMessage(`Đã gửi lời nhắc qua Email & Chuông thông báo đến ${remindedCount} bạn bè.`);
        setInfoModalVisible(true);
      } else {
        setInfoModalTitle('Chưa thể gửi nhắc nhở');
        setInfoModalMessage(lastErrMsg || 'Úi, bạn vừa nhắc nhở đây mà. Hãy đợi sau 12h nữa nha');
        setInfoModalVisible(true);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Không thể gửi nhắc nhở lúc này.';
      setInfoModalTitle('Thông báo');
      setInfoModalMessage(msg);
      setInfoModalVisible(true);
    }
  };

  const isPendingTabEmpty = pendingPayBills.length === 0 && pendingCollectBills.length === 0;

  return (
    <View style={styles.safeArea}>
      {/* Header matching BudgetScreen */}
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Chia tiền</Text>
              <Text style={styles.headerSubtitle}>Quản lý khoản cần trả / cần thu</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/split-bill/create' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.addButtonText}>Tạo mới</Text>
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      {/* Main Container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <Text style={styles.sectionTitle}>Quản lý khoản cần trả/cần thu</Text>

        <View style={styles.mainCard}>
          {/* 2 Tabs: Đang chờ | Đã xong */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'PENDING' && styles.tabItemActive]}
              onPress={() => setActiveTab('PENDING')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
                Đang chờ
              </Text>
              {activeTab === 'PENDING' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'COMPLETED' && styles.tabItemActive]}
              onPress={() => setActiveTab('COMPLETED')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
                Đã xong
              </Text>
              {activeTab === 'COMPLETED' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ paddingVertical: 50 }} color={PASTEL_PALETTE.accentDeep} />
          ) : activeTab === 'PENDING' ? (
            isPendingTabEmpty ? (
              /* Empty State matching design */
              <View style={styles.emptyIllustrationWrap}>
                <EmptyBoxIllustration />
                <Text style={styles.emptyTitle}>Tất cả các lời nhắc đã được hoàn thành</Text>
                <Text style={styles.emptySubtitle}>
                  Bạn có thể xem lại các lời nhắc trong quá khứ ở phần 'Đã xong'
                </Text>
              </View>
            ) : (
              /* Content matching Cần trả & Cần thu */
              <View>
                {/* 1. Cần trả Section */}
                <Text style={styles.sectionHeading}>
                  Cần trả {pendingPayBills.length > 0 ? `(${pendingPayBills.length})` : ''}
                </Text>
                {pendingPayBills.length === 0 ? (
                  <Text style={styles.emptySectionText}>Không có khoản nào cần trả</Text>
                ) : (
                  pendingPayBills.map((bill) => (
                    <TouchableOpacity
                      key={bill.id}
                      style={[styles.billCard, styles.billCardPay]}
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
                          <View style={styles.tagPill}>
                            <MaterialCommunityIcons name="account-cash-outline" size={13} color={PASTEL_PALETTE.accentDeep} />
                            <Text style={styles.tagPillText}>Chia tiền</Text>
                          </View>
                          <Text style={styles.billTitleText} numberOfLines={1}>
                            {bill.title}
                          </Text>
                        </View>
                        <Text style={styles.billDateText}>{formatDate(bill.createdAt)}</Text>
                      </View>

                      <View style={styles.billMainRow}>
                        <View style={styles.avatarCircle}>
                          {bill.creatorAvatarUrl ? (
                            <Image
                              source={{ uri: resolveMediaUrl(bill.creatorAvatarUrl) || '' }}
                              style={styles.avatarImage}
                            />
                          ) : (
                            <Text style={styles.avatarText}>
                              {getInitialLetter(bill.creatorUsername)}
                            </Text>
                          )}
                        </View>

                        <View style={styles.billMiddleCol}>
                          <Text style={styles.billLabel}>Cần trả {bill.creatorUsername}</Text>
                          <Text style={styles.billAmountText}>
                            Số tiền: <Text style={styles.billAmountBold}>{(bill.myAmount || 0).toLocaleString('vi-VN')}đ</Text>
                          </Text>
                        </View>

                        <View style={styles.billRightCol}>
                          <Text style={styles.statusTextOrange}>Chưa thanh toán</Text>
                          <TouchableOpacity
                            style={styles.paySolidBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/split-bill/[id]',
                                params: { id: bill.id },
                              } as any)
                            }
                            activeOpacity={0.8}
                          >
                            <Text style={styles.paySolidBtnText}>Thanh toán</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}

                <View style={styles.sectionDivider} />

                {/* 2. Cần thu Section */}
                <Text style={styles.sectionHeading}>
                  Cần thu {pendingCollectBills.length > 0 ? `(${pendingCollectBills.length})` : ''}
                </Text>
                {pendingCollectBills.length === 0 ? (
                  <Text style={styles.emptySectionText}>Không có khoản nào cần thu</Text>
                ) : (
                  pendingCollectBills.map((bill) => {
                    const totalAmount = bill.totalAmount || 0;
                    const paidAmount = bill.totalPaidAmount || 0;
                    const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
                    const isPartiallyPaid = paidAmount > 0;

                    return (
                      <TouchableOpacity
                        key={bill.id}
                        style={styles.billCard}
                        onPress={() =>
                          router.push({
                            pathname: '/split-bill/[id]',
                            params: { id: bill.id },
                          } as any)
                        }
                        activeOpacity={0.85}
                      >
                        {/* Card Top Row */}
                        <View style={styles.billCardTopRow}>
                          <View style={styles.billCardTopLeft}>
                            <View style={styles.tagPill}>
                              <MaterialCommunityIcons name="account-cash-outline" size={13} color={PASTEL_PALETTE.accentDeep} />
                              <Text style={styles.tagPillText}>Chia tiền</Text>
                            </View>
                            <Text style={styles.billTitleText} numberOfLines={1}>
                              {bill.title}
                            </Text>
                          </View>
                          <Text style={styles.billDateText}>{formatDate(bill.createdAt)}</Text>
                        </View>

                        {/* Card Main Row */}
                        <View style={styles.billMainRow}>
                          <View style={styles.avatarCircle}>
                            {currentUserAvatar || bill.creatorAvatarUrl ? (
                              <Image
                                source={{ uri: resolveMediaUrl(currentUserAvatar || bill.creatorAvatarUrl) || '' }}
                                style={styles.avatarImage}
                              />
                            ) : (
                              <Text style={styles.avatarText}>
                                {getInitialLetter(currentUserName || bill.creatorUsername)}
                              </Text>
                            )}
                          </View>

                          <View style={styles.billMiddleCol}>
                            <Text style={styles.billLabel}>Tổng cần thu</Text>
                            <Text style={styles.billAmountText}>
                              Nhận <Text style={styles.billAmountBold}>{paidAmount.toLocaleString('vi-VN')}đ</Text> / {totalAmount.toLocaleString('vi-VN')}đ
                            </Text>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressBar, { width: `${percent}%` }]} />
                            </View>
                          </View>

                          <View style={styles.billRightCol}>
                            <Text style={styles.statusTextOrange}>
                              {isPartiallyPaid ? 'Đã nhận một phần' : 'Chưa nhận'}
                            </Text>
                            <TouchableOpacity
                              style={styles.remindOutlineBtn}
                              onPress={() => handleRemindAll(bill)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.remindOutlineBtnText}>Nhắc nhở</Text>
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
                  <Ionicons name="checkmark-done-circle-outline" size={54} color={PASTEL_PALETTE.textGray} />
                  <Text style={styles.emptyTitle}>Chưa có khoản chia tiền nào đã hoàn tất</Text>
                  <Text style={styles.emptySubtitle}>
                    Các yêu cầu chia tiền đã thanh toán đủ hoặc đã hủy sẽ hiển thị tại đây.
                  </Text>
                </View>
              ) : (
                <View>
                  {completedPayBills.length > 0 && (
                    <View>
                      <Text style={styles.sectionHeading}>Khoản tôi đã trả ({completedPayBills.length})</Text>
                      {completedPayBills.map((bill) => (
                        <TouchableOpacity
                          key={bill.id}
                          style={styles.billCard}
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
                              <View style={styles.tagPill}>
                                <MaterialCommunityIcons name="account-cash-outline" size={13} color={PASTEL_PALETTE.accentDeep} />
                                <Text style={styles.tagPillText}>Chia tiền</Text>
                              </View>
                              <Text style={styles.billTitleText} numberOfLines={1}>
                                {bill.title}
                              </Text>
                            </View>
                            <Text style={styles.billDateText}>{formatDate(bill.createdAt)}</Text>
                          </View>

                          <View style={styles.billMainRow}>
                            <View style={styles.avatarCircle}>
                              {bill.creatorAvatarUrl ? (
                                <Image
                                  source={{ uri: resolveMediaUrl(bill.creatorAvatarUrl) || '' }}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <Text style={styles.avatarText}>
                                  {getInitialLetter(bill.creatorUsername)}
                                </Text>
                              )}
                            </View>
                            <View style={styles.billMiddleCol}>
                              <Text style={styles.billLabel}>Đã trả {bill.creatorUsername}</Text>
                              <Text style={styles.billAmountText}>
                                Số tiền: <Text style={styles.billAmountBold}>{(bill.myAmount || 0).toLocaleString('vi-VN')}đ</Text>
                              </Text>
                            </View>
                            <View style={styles.billRightCol}>
                              <Text style={styles.statusTextGreen}>
                                {bill.status === 'CANCELLED' ? 'Đã hủy' : 'Đã trả'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                      <View style={styles.sectionDivider} />
                    </View>
                  )}

                  {completedCollectBills.length > 0 && (
                    <View>
                      <Text style={styles.sectionHeading}>Khoản tôi đã thu ({completedCollectBills.length})</Text>
                      {completedCollectBills.map((bill) => (
                        <TouchableOpacity
                          key={bill.id}
                          style={styles.billCard}
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
                              <View style={styles.tagPill}>
                                <MaterialCommunityIcons name="account-cash-outline" size={13} color={PASTEL_PALETTE.accentDeep} />
                                <Text style={styles.tagPillText}>Chia tiền</Text>
                              </View>
                              <Text style={styles.billTitleText} numberOfLines={1}>
                                {bill.title}
                              </Text>
                            </View>
                            <Text style={styles.billDateText}>{formatDate(bill.createdAt)}</Text>
                          </View>

                          <View style={styles.billMainRow}>
                            <View style={styles.avatarCircle}>
                              {currentUserAvatar || bill.creatorAvatarUrl ? (
                                <Image
                                  source={{ uri: resolveMediaUrl(currentUserAvatar || bill.creatorAvatarUrl) || '' }}
                                  style={styles.avatarImage}
                                />
                              ) : (
                                <Text style={styles.avatarText}>
                                  {getInitialLetter(currentUserName || bill.creatorUsername)}
                                </Text>
                              )}
                            </View>
                            <View style={styles.billMiddleCol}>
                              <Text style={styles.billLabel}>Tổng đã thu</Text>
                              <Text style={styles.billAmountText}>
                                <Text style={styles.billAmountBold}>{(bill.totalPaidAmount || bill.totalAmount).toLocaleString('vi-VN')}đ</Text>
                              </Text>
                            </View>
                            <View style={styles.billRightCol}>
                              <Text style={bill.status === 'CANCELLED' ? styles.statusTextMuted : styles.statusTextGreen}>
                                {bill.status === 'CANCELLED' ? 'Đã hủy' : 'Đã hoàn tất'}
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

      {/* Info / Toast Modal */}
      <ConfirmModal
        visible={infoModalVisible}
        title={infoModalTitle}
        message={infoModalMessage}
        iconName="information-circle"
        iconColor={PASTEL_PALETTE.accentDeep}
        confirmText="Đã hiểu"
        hideCancel={true}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={() => setInfoModalVisible(false)}
        onCancel={() => setInfoModalVisible(false)}
      />
    </View>
  );
};

export default SplitBillListScreen;
