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
} from '../../components/AddCashBalanceModal/AddCashBalanceModal';
import { walletService } from '../../../../shared/api/services/walletService';
import { transactionService } from '../../../../shared/api/services/transactionService';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { filterCashTransactions, mapCashHistoryToItem } from '../../utils/cashMappers';

type MainTab = 'history' | 'report';
type FilterChip = 'TODAY' | 'WEEK' | 'MONTH';

const FILTERS: { key: FilterChip; label: string }[] = [
  { key: 'TODAY', label: 'Hôm nay' },
  { key: 'WEEK', label: 'Tuần' },
  { key: 'MONTH', label: 'Tháng' },
];

import { useLanguage, useTheme } from '../../../../shared/contexts/ThemeLanguageContext';

export default function NotebookScreen() {
  const [tab, setTab] = useState<MainTab>('history');
  const [filter, setFilter] = useState<FilterChip>('MONTH');
  const [cashBalance, setCashBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceMode, setBalanceMode] = useState<CashBalanceMode>('add');
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const filters = useMemo(() => [
    { key: 'TODAY' as FilterChip, label: isEn ? 'Today' : 'Hôm nay' },
    { key: 'WEEK' as FilterChip, label: isEn ? 'Week' : 'Tuần' },
    { key: 'MONTH' as FilterChip, label: isEn ? 'Month' : 'Tháng' },
  ], [isEn]);

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
          await loadCashData();
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
    }, [loadCashData])
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCashData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không làm mới được dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  const visibleTransactions = useMemo(
    () => filterCashTransactions(transactions, filter),
    [filter, transactions]
  );

  const openBalanceModal = (mode: CashBalanceMode) => {
    setBalanceMode(mode);
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
      const result = await transactionService.createManualTransaction({
        amount,
        type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
        categoryId,
        note,
      });
      setCashBalance(Number(result.cashBalance) || 0);
      await loadCashData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không ghi được giao dịch tiền mặt');
      throw e;
    } finally {
      setSaving(false);
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
            <View style={styles.filterRow}>
              {filters.map((item) => {
                const active = filter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.chip, { backgroundColor: active ? (theme.isDark ? theme.bgSoft : PASTEL_PALETTE.accentSoft) : theme.card, borderColor: active ? theme.primary : theme.cardBorder }]}
                    onPress={() => setFilter(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: active ? theme.primary : theme.textSecondary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PASTEL_PALETTE.accentDeep} />
              }
            >
              <RecentTransactions transactions={visibleTransactions} />
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
        onClose={() => setBalanceModalVisible(false)}
        onConfirm={handleCashBalanceChange}
      />
    </View>
  );
}
