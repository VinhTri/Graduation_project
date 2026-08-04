import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Modal, TextInput, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { budgetApi, BudgetResponse, BudgetSummaryResponse } from '../../../../shared/api/budgetApi';
import { BudgetCard } from '../../components/BudgetCard';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import PastelHeaderShell from '../../../../shared/components/PastelHeaderShell/PastelHeaderShell';
import { useTheme, useLanguage } from '../../../../shared/contexts/ThemeLanguageContext';

export const BudgetScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

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
      console.log('Lỗi khi tải ngân sách:', error);
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
      console.log('Lỗi khi xóa ngân sách:', error);
      Alert.alert(isEn ? 'Error' : 'Lỗi', error?.response?.data?.message || error?.message || 'Không thể xóa ngân sách');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteAction = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    budget: BudgetResponse
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
          onPress={() => handleDeleteBudget(budget.id, budget.name)}
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
            <Text style={styles.swipeDeleteText}>{isEn ? 'Delete' : 'Xóa'}</Text>
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  const renderDeleteModal = () => (
    <Modal
      transparent
      visible={!!deleteTarget}
      animationType="fade"
      onRequestClose={() => !isDeleting && setDeleteTarget(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.deleteModalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.deleteIconBadge}>
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>

          <Text style={[styles.deleteModalTitle, { color: theme.textPrimary }]}>
            {isEn ? 'Delete Budget?' : 'Xóa ngân sách?'}
          </Text>
          <Text style={[styles.deleteModalMessage, { color: theme.textSecondary }]}>
            {isEn ? 'Are you sure you want to delete budget ' : 'Bạn có chắc chắn muốn xóa ngân sách '}
            <Text style={{ fontWeight: '700', color: theme.primary }}>"{deleteTarget?.name}"</Text>?
          </Text>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={[styles.cancelModalButton, { backgroundColor: theme.bgSoft }]}
              onPress={() => setDeleteTarget(null)}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelModalButtonText, { color: theme.textSecondary }]}>{isEn ? 'Cancel' : 'Hủy'}</Text>
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
                <Text style={styles.confirmDeleteButtonText}>{isEn ? 'Delete' : 'Xóa'}</Text>
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
            <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? theme.textPrimary : '#7C3AED'} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.isDark ? theme.textPrimary : PASTEL_PALETTE.title }]}>
              {isEn ? 'Budgets' : 'Ngân sách'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : PASTEL_PALETTE.subtitle }]}>
              {isEn ? 'Manage limits & spending' : 'Quản lý hạn mức & chi tiêu'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.isDark ? theme.bgSoft : 'rgba(255, 255, 255, 0.7)' }]}
          onPress={() => router.push('/budget/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={18} color={theme.isDark ? theme.primary : PASTEL_PALETTE.title} />
          <Text style={[styles.addButtonText, { color: theme.isDark ? theme.primary : PASTEL_PALETTE.title }]}>
            {isEn ? 'New' : 'Thêm mới'}
          </Text>
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
    <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Ionicons name="search-outline" size={20} color={theme.textMuted} />
      <TextInput
        style={[styles.searchInput, { color: theme.textPrimary }]}
        placeholder={isEn ? "Search budgets..." : "Tìm kiếm ngân sách..."}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={theme.textMuted}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSummaryCard = () => {
    if (!summary) return null;
    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>
          {isEn ? 'Monthly Budget Overview' : 'Tổng quan ngân sách tháng này'}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{isEn ? 'Total Limit' : 'Tổng hạn mức'}</Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>{formatCurrency(summary.totalLimit)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{isEn ? 'Spent' : 'Đã chi tiêu'}</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatCurrency(summary.totalSpent)}</Text>
          </View>
        </View>
        <View style={[styles.summaryFooter, { borderTopColor: theme.divider }]}>
          <Text style={[styles.remainingText, { color: theme.textPrimary }]}>
            {isEn ? 'Remaining: ' : 'Còn lại: '}
            <Text style={{ fontWeight: '700', color: summary.remaining > 0 ? (theme.isDark ? '#34D399' : '#10B981') : '#EF4444' }}>
              {formatCurrency(summary.remaining)}
            </Text>
          </Text>
          {summary.warningCount > 0 && (
            <TouchableOpacity
              style={[styles.warningBadge, filterWarnings && styles.warningBadgeActive]}
              onPress={() => setFilterWarnings(prev => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons name="warning-outline" size={14} color={filterWarnings ? "#FFFFFF" : "#EF4444"} />
              <Text style={[styles.warningBadgeText, filterWarnings && { color: "#FFFFFF" }]}>
                {summary.warningCount} {isEn ? 'warnings' : 'cảnh báo'} {filterWarnings ? "✓" : ""}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="pie-chart-outline" size={64} color={theme.primary} />
      </View>
      <Text style={[styles.emptyText, { color: theme.textPrimary }]}>{isEn ? 'No budgets yet' : 'Chưa có ngân sách nào'}</Text>
      <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
        {isEn ? 'Create a budget to manage your spending effectively' : 'Hãy tạo ngân sách để quản lý chi tiêu hiệu quả hơn'}
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/budget/create')}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>{isEn ? 'Create First Budget' : 'Tạo ngân sách đầu tiên'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />
      {renderHeader()}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
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
            <View style={styles.budgetSwipeContainer}>
              <Swipeable
                renderRightActions={(progress, dragX) => renderDeleteAction(progress, dragX, item)}
                overshootRight={false}
                friction={2}
                rightThreshold={36}
              >
                <BudgetCard
                  budget={item}
                  onPress={() => {}}
                />
              </Swipeable>
            </View>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: -8,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
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
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  remainingText: {
    fontSize: 13,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
  budgetSwipeContainer: {
    marginBottom: 12,
  },
  swipeDeleteActionWrap: {
    width: 90,
    marginLeft: 8,
  },
  swipeDeleteButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeDeleteGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 16,
    minHeight: '100%',
  },
  swipeDeleteIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});
