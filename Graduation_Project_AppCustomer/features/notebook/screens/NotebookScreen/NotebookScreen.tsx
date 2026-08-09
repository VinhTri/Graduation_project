import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { styles } from './NotebookScreen.styles';
import { NotebookHeader } from '../../components/NotebookHeader/NotebookHeader';
import { RecentTransactions } from '../../components/RecentTransactions/RecentTransactions';
import { NotebookReport } from '../../components/NotebookReport/NotebookReport';
import { TransactionItem } from '../../components/RecentTransactions/RecentTransactions.types';
import {
  AddCashBalanceModal,
  CashBalanceMode,
  CashBalancePayload,
  InitialCashData,
} from '../../components/AddCashBalanceModal/AddCashBalanceModal';
import { walletService } from '../../../../shared/api/services/walletService';
import { transactionService } from '../../../../shared/api/services/transactionService';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { ConfirmModal } from '../../../../shared/components';
import Colors from '../../../../shared/constants/Colors';
import { filterCashTransactions, mapCashHistoryToItem } from '../../utils/cashMappers';
import { DateRangeSelector, DateFilterType } from '../../components/DateRangeSelector/DateRangeSelector';
import { SafeAreaView } from 'react-native-safe-area-context';

type MainTab = 'history' | 'report';

import { useLanguage, useTheme } from '../../../../shared/contexts/ThemeLanguageContext';
import { useCategoryContext } from '../../../../shared/contexts/CategoryContext';

export default function NotebookScreen() {
  const [tab, setTab] = useState<MainTab>('history');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cashBalance, setCashBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceMode, setBalanceMode] = useState<CashBalanceMode>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<InitialCashData | null>(null);
  const [txToDelete, setTxToDelete] = useState<InitialCashData | null>(null);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { loadCategories } = useCategoryContext();
  const isEn = language === 'en';

  const loadCashData = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          setLoading(true);
          await Promise.all([loadCashData(), loadCategories()]);
        } catch (e: any) {
          if (active) {
            Alert.alert('Lỗi', e?.message || 'Không tải được dữ liệu sổ tay tiền mặt');
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [loadCashData, loadCategories])
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadCashData(), loadCategories()]);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không làm mới được dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  const visibleTransactions = useMemo(
    () => filterCashTransactions(transactions, dateFilter, selectedDate),
    [dateFilter, selectedDate, transactions]
  );

  const openBalanceModal = (mode: CashBalanceMode, txData?: InitialCashData) => {
    setBalanceMode(mode);
    setSelectedTransaction(txData || null);
    setBalanceModalVisible(true);
  };

  const handleCashBalanceChange = async ({ amount, note, category }: CashBalancePayload) => {
    const categoryId = Number(category.id);
    if (!categoryId || Number.isNaN(categoryId)) {
      Alert.alert('Lỗi', 'Danh mục không hợp lệ');
      throw new Error('Invalid category');
    }

    try {
      setSaving(true);
      if (selectedTransaction) {
        const result = await transactionService.updateManualTransaction(selectedTransaction.transactionCode, {
          amount,
          type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
          categoryId,
          note,
        });
        setCashBalance(Number(result.cashBalance) || 0);
      } else {
        const result = await transactionService.createManualTransaction({
          amount,
          type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
          categoryId,
          note,
        });
        setCashBalance(Number(result.cashBalance) || 0);
      }
      await loadCashData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không lưu được giao dịch tiền mặt');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = (txToDelete?: InitialCashData) => {
    const targetTx = txToDelete || selectedTransaction;
    if (!targetTx) return;
    setTxToDelete(targetTx);
  };

  const confirmDeleteTransaction = async () => {
    if (!txToDelete) return;
    try {
      setSaving(true);
      await transactionService.deleteManualTransaction(txToDelete.transactionCode);
      setBalanceModalVisible(false);
      await loadCashData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không xóa được giao dịch');
    } finally {
      setSaving(false);
      setTxToDelete(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <NotebookHeader
        totalBalance={cashBalance}
        onAddCashBalance={() => openBalanceModal('add')}
        onSpendCashBalance={() => openBalanceModal('spend')}
      />

      <View style={[styles.content, { backgroundColor: theme.bg }]}>
            <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
              <TouchableOpacity
                style={[styles.tab, tab === 'history' && [styles.tabActive, { backgroundColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.white }]]}
                onPress={() => setTab('history')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, { color: tab === 'history' ? theme.primary : theme.textMuted }]}>
                  {isEn ? 'History' : 'Lịch sử'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'report' && [styles.tabActive, { backgroundColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.white }]]}
                onPress={() => setTab('report')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, { color: tab === 'report' ? theme.primary : theme.textMuted }]}>
                  {isEn ? 'Report' : 'Báo cáo'}
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : tab === 'history' ? (
              <>
                <DateRangeSelector
                  dateFilter={dateFilter}
                  selectedDate={selectedDate}
                  onChangeFilter={setDateFilter}
                  onChangeDate={setSelectedDate}
                />

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PASTEL_PALETTE.accentDeep} />
                  }
                >
                  <RecentTransactions 
                    transactions={visibleTransactions} 
                    onPressItem={(tx) => {
                      if (!tx.id) return; // Ensure it's a valid manual transaction with a code
                      openBalanceModal(
                        tx.type === 'INCOME' ? 'add' : 'spend',
                        {
                          transactionCode: tx.id,
                          amount: tx.amount,
                          note: tx.note,
                          category: {
                            id: tx.categoryId || 0,
                            label: tx.categoryLabel || 'Chưa phân loại',
                            icon: tx.categoryIcon || 'list',
                            color: tx.categoryColor || PASTEL_PALETTE.accentDeep,
                          },
                        }
                      );
                    }}
                    onDeleteItem={(tx) => {
                      if (!tx.id) return;
                      handleDeleteTransaction({
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
                    }}
                  />
                </ScrollView>
              </>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PASTEL_PALETTE.accentDeep} />
                }
              >
                <NotebookReport transactions={transactions} />
              </ScrollView>
            )}
          </View>

          <AddCashBalanceModal
            visible={balanceModalVisible}
            mode={balanceMode}
            currentBalance={cashBalance}
            saving={saving}
            initialData={selectedTransaction || undefined}
            onClose={() => setBalanceModalVisible(false)}
            onConfirm={handleCashBalanceChange}
            onDelete={() => { if (selectedTransaction) handleDeleteTransaction(selectedTransaction); }}
          />

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
    </View>
  );
}
