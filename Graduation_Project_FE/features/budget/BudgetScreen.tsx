import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetContext, BudgetItem, getBudgetStatus } from '../../shared/contexts/BudgetContext';
import Colors from '../../shared/constants/Colors';
import { styles } from './BudgetScreen.styles';
import BudgetCard from './components/BudgetCard';
import BudgetFormModal from './components/BudgetFormModal';

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const formatCurrency = (amount: number): string =>
  amount.toLocaleString('vi-VN') + 'đ';

const parseMonth = (month: string): { year: number; month: number } => {
  const [y, m] = month.split('-');
  return { year: parseInt(y), month: parseInt(m) };
};

const formatMonthLabel = (monthStr: string): string => {
  const { year, month } = parseMonth(monthStr);
  return `${MONTHS[month - 1]} ${year}`;
};

const changeMonth = (current: string, delta: number): string => {
  const { year, month } = parseMonth(current);
  let newMonth = month + delta;
  let newYear = year;
  if (newMonth > 12) { newMonth = 1; newYear++; }
  if (newMonth < 1) { newMonth = 12; newYear--; }
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

export const BudgetScreen = () => {
  const router = useRouter();
  const { budgets, currentMonth, setCurrentMonth, addBudget, updateBudget, deleteBudget } = useBudgetContext();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalProgress = totalLimit > 0 ? Math.min(totalSpent / totalLimit, 1) : 0;
  const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const exceededCount = budgets.filter(b => getBudgetStatus(b.spent, b.limit) === 'exceeded').length;
  const warningCount = budgets.filter(b => getBudgetStatus(b.spent, b.limit) === 'warning').length;

  const progressBarColor = totalPercent >= 100 ? Colors.error : totalPercent >= 80 ? Colors.warning : Colors.primary;

  // Cảnh báo khi vượt ngân sách — chỉ hiện 1 lần mỗi khi danh sách budget thay đổi
  const prevBudgetsKey = useRef('');
  useEffect(() => {
    if (budgets.length === 0) return;
    const exceeded = budgets.filter(b => getBudgetStatus(b.spent, b.limit) === 'exceeded');
    const key = exceeded.map(b => b.id).join(',');
    if (exceeded.length > 0 && key !== prevBudgetsKey.current) {
      prevBudgetsKey.current = key;
      const names = exceeded.map(b => `\u2022 ${b.categoryLabel}: đã chi ${b.spent.toLocaleString('vi-VN')}đ / ${b.limit.toLocaleString('vi-VN')}đ`).join('\n');
      Alert.alert(
        '⚠️ Vượt ngân sách!',
        `Bạn đã vượt giới hạn chi tiêu ở ${exceeded.length} danh mục:\n\n${names}`,
        [{ text: 'Xác nhận', style: 'default' }]
      );
    }
  }, [budgets]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setIsModalVisible(true);
  };

  const handleEdit = (budget: BudgetItem) => {
    setEditingBudget(budget);
    setIsModalVisible(true);
  };

  const handleSave = useCallback(async (data: Omit<BudgetItem, 'id'>) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await addBudget(data);
    }
  }, [editingBudget, addBudget, updateBudget]);

  const existingCategoryIds = editingBudget
    ? budgets.filter(b => b.id !== editingBudget.id).map(b => b.categoryId)
    : budgets.map(b => b.categoryId);

  return (
    <View style={styles.container}>
      {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ width: 80, alignItems: 'flex-start' }}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <Ionicons name="chevron-back-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Ngân Sách</Text>
            <View style={{ width: 80, flexDirection: 'row', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              <TouchableOpacity style={styles.addBtnHeader} onPress={() => router.push('/budget/calendar')} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtnHeader, { transform: [{ translateY: 2 }] }]} onPress={handleOpenAdd} activeOpacity={0.7}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Month selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.monthBtn} onPress={() => setCurrentMonth(changeMonth(currentMonth, -1))}>
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{formatMonthLabel(currentMonth)}</Text>
            <TouchableOpacity style={styles.monthBtn} onPress={() => setCurrentMonth(changeMonth(currentMonth, 1))}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          {budgets.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelText}>
                  Tổng ngân sách ({budgets.length} danh mục)
                </Text>
                <Text style={styles.summaryAmountText}>{formatCurrency(totalLimit)}</Text>
              </View>
              <View style={styles.summaryProgressBg}>
                <View
                  style={[styles.summaryProgressFill, {
                    width: `${totalProgress * 100}%`,
                    backgroundColor: progressBarColor,
                  }]}
                />
              </View>
              <View style={styles.summarySubRow}>
                <Text style={styles.summarySubText}>Đã chi: {formatCurrency(totalSpent)}</Text>
                <Text style={[styles.summarySubText, { fontWeight: '700' }]}>{totalPercent}%</Text>
              </View>

              {/* Alert badges */}
              {(exceededCount > 0 || warningCount > 0) && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {exceededCount > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Ionicons name="warning" size={12} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>{exceededCount} vượt ngân sách</Text>
                    </View>
                  )}
                  {warningCount > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Ionicons name="alert-circle" size={12} color="#F59E0B" />
                      <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>{warningCount} sắp hết</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

      {/* Content */}
      {budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="wallet-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có ngân sách</Text>
          <Text style={styles.emptySubtitle}>
            Tạo ngân sách theo từng danh mục để theo dõi chi tiêu và nhận cảnh báo khi vượt mức!
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyBtnText}>Thêm ngân sách</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>
            {budgets.length} danh mục có ngân sách
          </Text>
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={deleteBudget}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB */}
      {budgets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modal */}
      <BudgetFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSave}
        editingBudget={editingBudget}
        currentMonth={currentMonth}
        existingCategoryIds={existingCategoryIds}
        onDelete={deleteBudget}
      />
    </View>
  );
};

export default BudgetScreen;
