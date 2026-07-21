import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Modal, TextInput } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { budgetApi, BudgetResponse, BudgetSummaryResponse } from '../../../../shared/api/budgetApi';
import { BudgetCard } from '../../components/BudgetCard';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import PastelHeaderShell from '../../../../shared/components/PastelHeaderShell/PastelHeaderShell';

export const BudgetScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterWarnings, setFilterWarnings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBudgetsAndSummary = async () => {
    try {
      setLoading(true);
      const [data, summaryData] = await Promise.all([
        budgetApi.getBudgets(),
        budgetApi.getBudgetSummary(),
      ]);

      let fetchedBudgets = Array.isArray(data) ? [...data] : [];

      // REMOVE DỮ LIỆU GIẢ LẬP TẠM THỜI
      
      const warningCount = fetchedBudgets.filter(b => b.amount > 0 && (b.spentAmount / b.amount) >= 0.8).length;
      const totalLimit = fetchedBudgets.reduce((acc, b) => acc + (b.amount || 0), 0);
      const totalSpent = fetchedBudgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0);

      const fetchedSummary = {
        totalLimit,
        totalSpent,
        remaining: Math.max(0, totalLimit - totalSpent),
        warningCount,
      };

      setBudgets(fetchedBudgets);
      setSummary(fetchedSummary);
    } catch (error) {
      console.error('Lỗi khi tải ngân sách:', error);
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudgetsAndSummary();
    }, [])
  );

  useEffect(() => {
    if (pathname === '/budget') {
      fetchBudgetsAndSummary();
    }
  }, [pathname]);

  const handleDeleteBudget = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await budgetApi.deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      fetchBudgetsAndSummary();
    } catch (error: any) {
      console.error('Lỗi khi xóa ngân sách:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể xóa ngân sách');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteModal = () => (
    <Modal
      transparent
      visible={!!deleteTarget}
      animationType="fade"
      onRequestClose={() => !isDeleting && setDeleteTarget(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContent}>
          <View style={styles.deleteIconBadge}>
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>
          
          <Text style={styles.deleteModalTitle}>Xóa ngân sách?</Text>
          <Text style={styles.deleteModalMessage}>
            Bạn có chắc chắn muốn xóa ngân sách{' '}
            <Text style={{ fontWeight: '700', color: PASTEL_PALETTE.title }}>"{deleteTarget?.name}"</Text> không? 
            Thao tác này không thể hoàn tác.
          </Text>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setDeleteTarget(null)}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelModalButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmDeleteButton, isDeleting && { opacity: 0.7 }]}
              onPress={confirmDelete}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmDeleteButtonText}>Xóa</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const renderHeader = () => (
    <PastelHeaderShell contentStyle={styles.headerContent}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.title} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Ngân sách</Text>
            <Text style={styles.headerSubtitle}>Quản lý hạn mức & chi tiêu</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/budget/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={18} color={PASTEL_PALETTE.title} />
          <Text style={styles.addButtonText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>
    </PastelHeaderShell>
  );

const removeVietnameseTones = (str: string): string => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

  const normalizedQuery = removeVietnameseTones(searchQuery);
  const displayedBudgets = budgets
    .filter(b => b.amount > 0 && (!filterWarnings || (b.spentAmount / b.amount) >= 0.8))
    .filter(b => {
      const normName = removeVietnameseTones(b.name || '');
      const normCategory = removeVietnameseTones(b.categoryName || '');
      return normName.includes(normalizedQuery) || normCategory.includes(normalizedQuery);
    });

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={20} color={PASTEL_PALETTE.textGray} />
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm ngân sách..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={PASTEL_PALETTE.textGray}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color={PASTEL_PALETTE.textGray} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSummaryCard = () => {
    if (!summary) return null;
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tổng quan ngân sách tháng này</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng hạn mức</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalLimit)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Đã chi tiêu</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatCurrency(summary.totalSpent)}</Text>
          </View>
        </View>
        <View style={styles.summaryFooter}>
          <Text style={styles.remainingText}>
            Còn lại: <Text style={{ fontWeight: '700', color: summary.remaining > 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(summary.remaining)}</Text>
          </Text>
          {summary.warningCount > 0 && (
            <TouchableOpacity 
              style={[styles.warningBadge, filterWarnings && styles.warningBadgeActive]}
              onPress={() => setFilterWarnings(prev => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons name="warning-outline" size={14} color={filterWarnings ? "#FFFFFF" : "#EF4444"} />
              <Text style={[styles.warningBadgeText, filterWarnings && { color: "#FFFFFF" }]}>
                {summary.warningCount} cảnh báo {filterWarnings ? "✓" : ""}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {filterWarnings && (
          <View style={styles.filterBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="filter" size={14} color="#EF4444" />
              <Text style={styles.filterBannerText}>Đang lọc các ngân sách chi tiêu ≥ 80%</Text>
            </View>
            <TouchableOpacity onPress={() => setFilterWarnings(false)} style={styles.clearFilterButton}>
              <Text style={styles.clearFilterText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="pie-chart-outline" size={64} color={PASTEL_PALETTE.accentDeep} />
      </View>
      <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
      <Text style={styles.emptySubText}>Hãy tạo ngân sách để quản lý chi tiêu hiệu quả hơn</Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/budget/create')}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>Tạo ngân sách đầu tiên</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PASTEL_PALETTE.headerStart} />
      {renderHeader()}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
        </View>
      ) : (
        <FlatList
          data={displayedBudgets}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View>
              {budgets.length > 0 ? renderSummaryCard() : null}
              {budgets.length > 0 ? renderSearch() : null}
            </View>
          }
          renderItem={({ item }) => (
            <BudgetCard 
              budget={item} 
              onPress={() => {
                // Detail view if needed
              }}
              onEdit={() => {
                router.push(`/budget/edit/${item.id}`);
              }}
              onDelete={() => handleDeleteBudget(item.id, item.name)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
      {renderDeleteModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    color: PASTEL_PALETTE.title,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: PASTEL_PALETTE.subtitle,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: PASTEL_PALETTE.title,
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: PASTEL_PALETTE.title,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: PASTEL_PALETTE.border,
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: PASTEL_PALETTE.textGray,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
    marginTop: 2,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PASTEL_PALETTE.border,
  },
  remainingText: {
    fontSize: 13,
    color: PASTEL_PALETTE.title,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  warningBadgeActive: {
    backgroundColor: '#EF4444',
  },
  warningBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  filterBannerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  clearFilterButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: PASTEL_PALETTE.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  deleteIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
    color: PASTEL_PALETTE.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cheatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 48,
    width: '100%',
    marginBottom: 16,
  },
  cheatInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    padding: 0,
  },
  currencySuffix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.accentDeep,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
