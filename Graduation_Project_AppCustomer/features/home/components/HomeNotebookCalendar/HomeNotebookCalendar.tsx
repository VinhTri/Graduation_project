import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { styles } from './HomeNotebookCalendar.styles';
import { DayActionModal } from './DayActionModal';
import {
  AddCashBalanceModal,
  CashBalanceMode,
  CashBalancePayload,
  InitialCashData,
} from '@/features/notebook/components/AddCashBalanceModal/AddCashBalanceModal';
import { TransactionItem } from '@/features/notebook/components/RecentTransactions/RecentTransactions.types';
import { mapCashHistoryToItem } from '@/features/notebook/utils/cashMappers';
import { transactionService } from '@/shared/api/services/transactionService';
import { walletService } from '@/shared/api/services/walletService';
import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext';
import { useCategoryContext } from '@/shared/contexts/CategoryContext';
import { ConfirmModal } from '@/shared/components';
import { Toast } from '@/shared/components/Toast/Toast';
import Colors from '@/shared/constants/Colors';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';

const WEEKDAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HomeNotebookCalendar: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const { loadCategories } = useCategoryContext();
  const isEn = language === 'en';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'error' | 'success' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Day Modal & Add/Edit Cash Modal States
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isDayModalVisible, setIsDayModalVisible] = useState<boolean>(false);
  const [isBalanceModalVisible, setIsBalanceModalVisible] = useState<boolean>(false);
  const [balanceMode, setBalanceMode] = useState<CashBalanceMode>('spend');
  const [selectedTransaction, setSelectedTransaction] = useState<InitialCashData | null>(null);
  const [txToDelete, setTxToDelete] = useState<InitialCashData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [wallet, history] = await Promise.all([
        walletService.getCashWallet(),
        transactionService.getTransactionHistory('cash'),
      ]);
      setCashBalance(Number(wallet?.balance) || 0);
      setTransactions(
        (history || [])
          .map(mapCashHistoryToItem)
          .filter((item): item is TransactionItem => item != null)
      );
    } catch (e) {
      console.log('Error loading notebook calendar data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          await Promise.all([loadData(), loadCategories()]);
        } catch (e) {
          // Silent fallback on home screen
        }
      })();
      return () => {
        active = false;
      };
    }, [loadData, loadCategories])
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Today key
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Group transactions by date key: YYYY-MM-DD
  const txByDateMap = useMemo(() => {
    const map: Record<string, TransactionItem[]> = {};
    transactions.forEach((tx) => {
      if (!tx.createdAt) return;
      const txDate = new Date(tx.createdAt);
      if (Number.isNaN(txDate.getTime())) return;
      const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(tx);
    });
    return map;
  }, [transactions]);

  // Navigate month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  // Monday = 0, Sunday = 6
  const startDayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const totalGridCells = Math.ceil((startDayOffset + daysInMonth) / 7) * 7;

  const gridCells = useMemo(() => {
    const cells: Array<{
      dayNum: number | null;
      dateKey: string | null;
      isToday: boolean;
      isFuture: boolean;
      hasTransactions: boolean;
      transactions: TransactionItem[];
    }> = [];

    for (let i = 0; i < totalGridCells; i++) {
      if (i < startDayOffset || i >= startDayOffset + daysInMonth) {
        cells.push({
          dayNum: null,
          dateKey: null,
          isToday: false,
          isFuture: false,
          hasTransactions: false,
          transactions: [],
        });
      } else {
        const day = i - startDayOffset + 1;
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateKey === todayKey;
        const isFuture = dateKey > todayKey;
        const dayTxs = txByDateMap[dateKey] || [];
        const hasTransactions = dayTxs.length > 0;

        cells.push({
          dayNum: day,
          dateKey,
          isToday,
          isFuture,
          hasTransactions,
          transactions: dayTxs,
        });
      }
    }
    return cells;
  }, [year, month, startDayOffset, daysInMonth, totalGridCells, todayKey, txByDateMap]);

  // Click on a calendar cell
  const handlePressCell = (cell: typeof gridCells[0]) => {
    if (!cell.dateKey || cell.dayNum === null || cell.isFuture) return;
    setSelectedDayKey(cell.dateKey);
    setIsDayModalVisible(true);
  };

  // Selected date details for modals
  const selectedDayData = useMemo(() => {
    if (!selectedDayKey) return null;
    const [y, m, d] = selectedDayKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeekNamesVi = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeekNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const dayOfWeek = isEn ? dayOfWeekNamesEn[dateObj.getDay()] : dayOfWeekNamesVi[dateObj.getDay()];
    const displayDateText = `${dayOfWeek}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    const displayShortDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    const targetIsoDate = new Date(y, m - 1, d, 12, 0, 0).toISOString();
    const isFuture = selectedDayKey > todayKey;

    const dayTxs = txByDateMap[selectedDayKey] || [];

    return {
      dateKey: selectedDayKey,
      displayDateText,
      displayShortDate,
      targetIsoDate,
      isFuture,
      transactions: dayTxs,
    };
  }, [selectedDayKey, isEn, todayKey, txByDateMap]);

  // Open add income modal
  const handleOpenAddIncome = () => {
    setBalanceMode('add');
    setSelectedTransaction(null);
    setIsDayModalVisible(false);
    setIsBalanceModalVisible(true);
  };

  // Open add expense modal
  const handleOpenAddExpense = () => {
    setBalanceMode('spend');
    setSelectedTransaction(null);
    setIsDayModalVisible(false);
    setIsBalanceModalVisible(true);
  };

  // Open edit modal for a transaction
  const handlePressTransactionItem = (tx: TransactionItem) => {
    if (!tx.id) return;
    setSelectedTransaction({
      transactionCode: tx.id,
      amount: tx.amount,
      note: tx.note,
      category: {
        id: tx.categoryId || 0,
        label: tx.categoryLabel || 'Chưa phân loại',
        icon: tx.categoryIcon || 'list',
        color: tx.categoryColor || PASTEL_PALETTE.accentDeep,
      },
    });
    setBalanceMode(tx.type === 'INCOME' ? 'add' : 'spend');
    setIsDayModalVisible(false);
    setIsBalanceModalVisible(true);
  };

  // Confirm create or update cash transaction
  const handleCashBalanceChange = async ({ amount, note, category, date }: CashBalancePayload) => {
    const categoryId = Number(category.id);
    if (!categoryId || Number.isNaN(categoryId)) {
      Alert.alert('Lỗi', 'Danh mục không hợp lệ');
      throw new Error('Invalid category');
    }

    try {
      setSaving(true);
      if (selectedTransaction) {
        await transactionService.updateManualTransaction(selectedTransaction.transactionCode, {
          amount,
          type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
          categoryId,
          note,
          createdAt: date,
        });
      } else {
        await transactionService.createManualTransaction({
          amount,
          type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
          categoryId,
          note,
          createdAt: date || (selectedDayData ? selectedDayData.targetIsoDate : undefined),
        });
      }
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không lưu được giao dịch tiền mặt');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    setTxToDelete(selectedTransaction);
  };

  const confirmDeleteTransaction = async () => {
    if (!txToDelete) return;
    try {
      setSaving(true);
      await transactionService.deleteManualTransaction(txToDelete.transactionCode);
      setIsBalanceModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không xóa được giao dịch');
    } finally {
      setSaving(false);
      setTxToDelete(null);
    }
  };

  const weekdays = isEn ? WEEKDAYS_EN : WEEKDAYS_VI;
  const monthTitle = isEn
    ? `${currentDate.toLocaleString('en-US', { month: 'long' })} ${year}`
    : `Tháng ${month + 1}/${year}`;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: theme.primary }]}>{t('quickNotebook')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('quickNotebookSubtitle')}
        </Text>
      </View>

      {/* Calendar Card */}
      <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Month Navigator Header */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.isDark ? theme.bgSoft : '#FAFAFA', borderColor: theme.cardBorder }]}
            activeOpacity={0.75}
            onPress={handlePrevMonth}
          >
            <Ionicons name="chevron-back" size={18} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles.monthTitleWrap}>
            <Text style={[styles.monthTitleText, { color: theme.primary }]}>{monthTitle}</Text>
          </View>

          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.isDark ? theme.bgSoft : '#FAFAFA', borderColor: theme.cardBorder }]}
            activeOpacity={0.75}
            onPress={handleNextMonth}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekdays Row */}
        <View
          style={[
            styles.weekdaysRow,
            {
              backgroundColor: theme.isDark ? theme.bgSoft : '#F8F6FF',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {weekdays.map((dayName, idx) => {
            const isWeekend = idx >= 5;
            return (
              <View key={dayName} style={styles.weekdayCol}>
                <Text
                  style={[
                    styles.weekdayText,
                    { color: theme.textPrimary },
                    isWeekend && styles.weekendText,
                  ]}
                >
                  {dayName}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Days Grid */}
        <View style={styles.grid}>
          {gridCells.map((cell, index) => {
            const isLastInRow = (index + 1) % 7 === 0;

            if (cell.dayNum === null) {
              return (
                <View
                  key={`empty-${index}`}
                  style={[
                    styles.cell,
                    styles.cellEmpty,
                    isLastInRow && styles.cellNoRightBorder,
                    { borderColor: theme.isDark ? theme.bgSoft : '#F3F4F6' },
                  ]}
                />
              );
            }

            const isHighlighted = cell.isToday || (cell.hasTransactions && !cell.isFuture);

            return (
              <TouchableOpacity
                key={cell.dateKey}
                style={[
                  styles.cell,
                  isLastInRow && styles.cellNoRightBorder,
                  cell.isToday && styles.cellToday,
                  cell.hasTransactions && !cell.isToday && styles.cellRecorded,
                  cell.isFuture && styles.cellFuture,
                  { borderColor: theme.isDark ? theme.bgSoft : '#F3F4F6' },
                ]}
                activeOpacity={0.7}
                disabled={cell.isFuture}
                onPress={() => handlePressCell(cell)}
              >
                <View style={styles.dayNumWrap}>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: theme.textPrimary },
                      cell.isFuture && styles.dayNumFuture,
                      cell.isToday && styles.dayNumToday,
                    ]}
                  >
                    {cell.dayNum}
                  </Text>
                </View>

                {/* Status Text (Chưa ghi chép / Đã ghi chép) */}
                {!cell.isFuture && (
                  <View style={styles.statusTextWrap}>
                    {cell.hasTransactions ? (
                      <Text style={styles.statusRecorded} numberOfLines={2}>
                        {isEn ? 'Logged' : 'Đã ghi\nchép'}
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.statusNotRecorded,
                          { color: theme.textMuted },
                        ]}
                        numberOfLines={2}
                      >
                        {isEn ? 'Not\nlogged' : 'Chưa ghi\nchép'}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Day Action Modal */}
      {selectedDayData && (
        <DayActionModal
          visible={isDayModalVisible}
          dateStr={selectedDayData.dateKey}
          displayDateText={selectedDayData.displayDateText}
          transactions={selectedDayData.transactions}
          isFuture={selectedDayData.isFuture}
          onClose={() => setIsDayModalVisible(false)}
          onAddIncome={handleOpenAddIncome}
          onAddExpense={handleOpenAddExpense}
          onPressTransaction={handlePressTransactionItem}
        />
      )}

      {/* Add / Edit Cash Transaction Modal */}
      <AddCashBalanceModal
        visible={isBalanceModalVisible}
        mode={balanceMode}
        currentBalance={cashBalance}
        saving={saving}
        initialData={selectedTransaction || undefined}
        targetDate={selectedDayData ? selectedDayData.targetIsoDate : undefined}
        displayDate={selectedDayData ? selectedDayData.displayShortDate : undefined}
        onClose={() => setIsBalanceModalVisible(false)}
        onConfirm={handleCashBalanceChange}
        onDelete={handleDeleteTransaction}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        visible={!!txToDelete}
        title="Xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này không? Số dư sổ tay và ngân sách sẽ được hoàn lại tự động."
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setTxToDelete(null)}
      />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

export default HomeNotebookCalendar;
