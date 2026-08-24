import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, PALETTE } from './InvoiceScreen.styles';
import { Colors } from '@/shared/constants/Colors';
import { invoiceService, InvoiceResponse } from '@/shared/api/services/invoiceService';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { ConfirmModal } from '@/shared/components';

import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext';

type FilterTab = 'all' | 'unpaid' | 'paid';

export const InvoiceScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [itemToComplete, setItemToComplete] = useState<{ id: number, name: string } | null>(null);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const openDeleteModal = (id: number, name: string) => {
    setItemToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteModalVisible(false);

    try {
      setLoading(true);
      await invoiceService.deleteInvoice(itemToDelete.id);
      fetchInvoices(); 
      
      setSuccessMessage(`Đã xóa hóa đơn "${itemToDelete.name}" thành công!`);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không thể xóa hóa đơn này.");
      setErrorModalVisible(true);
      setLoading(false);
    } finally {
      setItemToDelete(null);
    }
  };

  const openCompleteModal = (id: number, name: string) => {
    setItemToComplete({ id, name });
    setCompleteModalVisible(true);
  };

  const confirmComplete = async () => {
    if (!itemToComplete) return;
    try {
      setLoading(true);
      setCompleteModalVisible(false);
      await invoiceService.updateInvoiceStatus(itemToComplete.id, true);
      fetchInvoices();
      setSuccessMessage(`Đã đánh dấu hóa đơn "${itemToComplete.name}" là đã thanh toán.`);
      setSuccessModalVisible(true);
    } catch (error: any) {
      console.log("Complete Invoice Error:", error);
      setErrorMessage(error?.message || error?.response?.data?.message || "Không thể cập nhật hóa đơn.");
      setErrorModalVisible(true);
    } finally {
      setItemToComplete(null);
      setLoading(false);
    }
  };

  // Lọc danh sách
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterTab === 'paid') return inv.isPaid;
      if (filterTab === 'unpaid') return !inv.isPaid;
      return true;
    });
  }, [invoices, filterTab]);

  // Tính tổng nợ
  const totalUnpaid = useMemo(() => {
    return invoices.filter(inv => !inv.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  }, [invoices]);

  const unpaidSummary = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let dueThisMonth = 0;
    let overdueCount = 0;

    invoices.filter(inv => !inv.isPaid).forEach(inv => {
      const [year, month, day] = inv.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      if (year === now.getFullYear() && month === now.getMonth() + 1) {
        dueThisMonth += Number(inv.amount) || 0;
      }
      if (dueDate < todayStart) overdueCount += 1;
    });

    return { dueThisMonth, overdueCount };
  }, [invoices]);

  // Utilities for UI
  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('điện')) return { name: 'flash', color: '#F59E0B', bg: '#FEF3C7' };
    if (n.includes('nước')) return { name: 'water', color: '#3B82F6', bg: '#DBEAFE' };
    if (n.includes('mạng') || n.includes('wifi') || n.includes('internet')) return { name: 'wifi', color: '#8B5CF6', bg: '#EDE9FE' };
    if (n.includes('học phí') || n.includes('trường')) return { name: 'school', color: '#F43F5E', bg: '#FFE4E6' }; // Changed school color to distinguish from rent
    if (n.includes('nhà') || n.includes('phòng')) return { name: 'home', color: '#10B981', bg: '#D1FAE5' };
    return { name: 'receipt', color: '#64748B', bg: '#F1F5F9' };
  };

  const getInvoiceStatus = (item: InvoiceResponse) => {
    if (item.isPaid) return { text: 'Đã thanh toán', color: '#10B981', bg: '#D1FAE5' };
    const [year, month, day] = item.dueDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isOverdue = dueDate < todayStart;
    if (isOverdue) return { text: 'Quá hạn', color: '#EF4444', bg: '#FEE2E2' };
    return { text: 'Chưa thanh toán', color: '#F59E0B', bg: '#FEF3C7' };
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    id: number,
    name: string
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 1],
      extrapolate: 'clamp',
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
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
          onPress={() => openDeleteModal(id, name)}
        >
          <LinearGradient
            colors={['#FCA5A5', '#EF4444', '#DC2626']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.swipeDeleteGradient}
          >
            <View style={styles.swipeDeleteIconCircle}>
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.swipeDeleteText}>Xóa</Text>
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  const renderInvoiceItem = ({ item }: { item: InvoiceResponse }) => {
    const formattedAmount = item.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const [year, month, day] = item.dueDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const formattedDate = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const sIcon = getServiceIcon(item.invoiceName);
    const sStatus = getInvoiceStatus(item);

    return (
      <Swipeable 
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id, item.invoiceName)}
        overshootRight={false}
        friction={2}
        rightThreshold={36}
      >
        <TouchableOpacity 
          style={styles.invoiceCard}
          activeOpacity={0.7}
          onPress={() => {
            if (item.isPaid) {
              router.push(`/invoice/${item.id}?viewOnly=true`);
            } else if (item.invoiceName.toLowerCase().includes('điện')) {
              router.push(`/invoice/service/electricity?editId=${item.id}`);
            } else if (item.invoiceName.toLowerCase().includes('nước')) {
              router.push(`/invoice/service/water?editId=${item.id}`);
            } else if (item.invoiceName.toLowerCase().includes('mạng') || item.invoiceName.toLowerCase().includes('internet')) {
              router.push(`/invoice/service/internet?editId=${item.id}`);
            } else if (item.invoiceName.toLowerCase().includes('nhà') || item.invoiceName.toLowerCase().includes('phòng')) {
              router.push(`/invoice/service/rent?editId=${item.id}`);
            } else {
              router.push(`/invoice/${item.id}`);
            }
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={[styles.serviceIconContainer, { backgroundColor: sIcon.bg }]}>
              <Ionicons name={sIcon.name as any} size={20} color={sIcon.color} />
            </View>
            
            <View style={styles.invoiceBody}>
              <View style={styles.invoiceHeaderTop}>
                <Text style={styles.invoiceName} numberOfLines={1}>{item.invoiceName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sStatus.bg }]}>
                  <Text style={[styles.statusText, { color: sStatus.color }]}>{sStatus.text}</Text>
                </View>
              </View>
              <Text style={styles.invoiceAmount}>{formattedAmount} VNĐ</Text>
              <View style={styles.invoiceFooter}>
                <View style={styles.dueDateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text style={styles.dueDateText}>Đến hạn: {formattedDate}</Text>
                </View>
                {item.reminderOption && item.reminderOption !== 'Không nhắc nhở' && (
                  <View style={styles.reminderBadge}>
                    <Text style={styles.reminderText}>{item.reminderOption}</Text>
                  </View>
                )}
              </View>

              {!item.isPaid && (
                <TouchableOpacity 
                  style={[styles.payNowButton, { backgroundColor: '#EC4899' }]}
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    openCompleteModal(item.id, item.invoiceName);
                  }}
                >
                  <Text style={styles.payNowText}>Đánh dấu đã thanh toán</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[PALETTE.headerStart, PALETTE.headerMid, PALETTE.headerEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerDecorCircleLarge} />
          <View style={styles.headerDecorCircleSmall} />

          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>{t('invoiceManagement')}</Text>
                <Text style={styles.headerSubtitle}>{t('invoiceSub')}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/invoice/create')}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Tạo mới</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Body */}
      {loading && !refreshing ? (
        <View style={styles.loadingContent}>
          <View style={styles.skeletonSummary} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderInvoiceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={styles.summaryWidget}>
                <View style={styles.summaryOrbLarge} />
                <View style={styles.summaryOrbSmall} />
                <View style={styles.summaryTopRow}>
                  <View>
                    <Text style={styles.summaryTitle}>Tổng cần thanh toán</Text>
                    <Text style={styles.summaryAmount}>
                      {totalUnpaid.toLocaleString('vi-VN')} <Text style={styles.summaryCurrency}>đ</Text>
                    </Text>
                  </View>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="receipt-outline" size={23} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Đến hạn tháng này</Text>
                    <Text style={styles.summaryStatValue}>{unpaidSummary.dueThisMonth.toLocaleString('vi-VN')} đ</Text>
                  </View>
                  <View style={styles.summaryStatDivider} />
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Đã quá hạn</Text>
                    <Text style={[styles.summaryStatValue, unpaidSummary.overdueCount > 0 && styles.summaryStatDanger]}>
                      {unpaidSummary.overdueCount} hóa đơn
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.trackerNotice}>
                <Ionicons name="notifications-outline" size={19} color="#6D28D9" />
                <Text style={styles.trackerNoticeText}>
                  SmartSpend theo dõi và nhắc hạn; việc thanh toán được thực hiện bên ngoài ứng dụng.
                </Text>
              </View>

              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionHeading}>Tạo nhanh</Text>
                <TouchableOpacity onPress={() => router.push('/invoice/create')} activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>Hóa đơn khác</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.servicesGridContainer}>
                {[
                  { label: 'Tiền điện', icon: 'flash', color: '#D97706', bg: '#FEF3C7', route: '/invoice/service/electricity' },
                  { label: 'Tiền nước', icon: 'water', color: '#2563EB', bg: '#DBEAFE', route: '/invoice/service/water' },
                  { label: 'Tiền mạng', icon: 'wifi', color: '#7C3AED', bg: '#EDE9FE', route: '/invoice/service/internet' },
                  { label: 'Tiền nhà', icon: 'home', color: '#059669', bg: '#D1FAE5', route: '/invoice/service/rent' },
                ].map(service => (
                  <TouchableOpacity
                    key={service.label}
                    style={styles.serviceGridItem}
                    onPress={() => router.push(service.route as any)}
                    activeOpacity={0.72}
                  >
                    <View style={[styles.serviceGridIconWrap, { backgroundColor: service.bg }]}>
                      <Ionicons name={service.icon as any} size={22} color={service.color} />
                    </View>
                    <Text style={styles.serviceGridText}>{service.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.listHeadingRow}>
                <Text style={styles.sectionHeading}>Hóa đơn của bạn</Text>
                <Text style={styles.invoiceCount}>{filteredInvoices.length} hóa đơn</Text>
              </View>

              <View style={styles.tabsContainer}>
                {(['all', 'unpaid', 'paid'] as FilterTab[]).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setFilterTab(tab)}
                    style={[styles.tabItem, filterTab === tab && styles.tabItemActive]}
                  >
                    <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
                      {tab === 'all' ? 'Tất cả' : tab === 'unpaid' ? 'Chưa trả' : 'Đã trả'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={42} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>Không có hóa đơn</Text>
              <Text style={styles.emptySubtitle}>
                {filterTab === 'unpaid'
                  ? 'Bạn đã xử lý tất cả hóa đơn cần thanh toán.'
                  : 'Tạo hóa đơn đầu tiên để bắt đầu theo dõi hạn thanh toán.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Xóa hóa đơn"
        message={itemToDelete ? `Bạn có chắc chắn muốn xóa hóa đơn "${itemToDelete.name}" không?` : ""}
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      />

      {/* Complete Confirmation Modal */}
      <ConfirmModal
        visible={completeModalVisible}
        title="Xác nhận đã thanh toán"
        message={itemToComplete ? `Bạn đã thanh toán hóa đơn "${itemToComplete.name}" bên ngoài SmartSpend? Thao tác này chỉ cập nhật trạng thái và không trừ tiền trong ứng dụng.` : ""}
        iconName="checkmark-circle-outline"
        iconColor="#EC4899"
        confirmText="Đã thanh toán"
        cancelText="Hủy"
        isDestructive={false}
        onConfirm={confirmComplete}
        onCancel={() => {
          setCompleteModalVisible(false);
          setItemToComplete(null);
        }}
      />

      {/* Success Modal */}
      <ConfirmModal
        visible={successModalVisible}
        title="Thành công"
        message={successMessage}
        iconName="checkmark-circle"
        iconColor="#EC4899"
        confirmText="Hoàn tất"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => setSuccessModalVisible(false)}
        onCancel={() => setSuccessModalVisible(false)}
      />

      {/* Error Modal */}
      <ConfirmModal
        visible={errorModalVisible}
        title="Lỗi"
        message={errorMessage}
        iconName="alert-circle"
        iconColor={Colors.error}
        confirmText="Đã hiểu"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />
    </View>
  );
};

export default InvoiceScreen;
