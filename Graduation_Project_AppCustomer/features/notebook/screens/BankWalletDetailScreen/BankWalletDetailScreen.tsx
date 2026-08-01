import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './BankWalletDetailScreen.styles';
import { RecentTransactions } from '../../components/RecentTransactions/RecentTransactions';
import { NotebookReport } from '../../components/NotebookReport/NotebookReport';
import { TransactionItem } from '../../components/RecentTransactions/RecentTransactions.types';
import { PastelHeaderShell } from '../../../../shared/components/PastelHeaderShell';
import {
  AddCashBalanceModal,
  CashBalanceMode,
  CashBalancePayload,
  InitialCashData,
} from '../../components/AddCashBalanceModal/AddCashBalanceModal';
import { walletService, WalletData } from '../../../../shared/api/services/walletService';
import { transactionService } from '../../../../shared/api/services/transactionService';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { ConfirmModal } from '../../../../shared/components';
import Colors from '../../../../shared/constants/Colors';
import { filterCashTransactions, mapCashHistoryToItem } from '../../utils/cashMappers';

type MainTab = 'history' | 'report';
type FilterChip = 'TODAY' | 'WEEK' | 'MONTH';

const FILTERS: { key: FilterChip; label: string }[] = [
  { key: 'TODAY', label: 'Hôm nay' },
  { key: 'WEEK', label: 'Tuần' },
  { key: 'MONTH', label: 'Tháng' },
];

interface Props {
  walletId: number;
}

export const BankWalletDetailScreen = ({ walletId }: Props) => {
  const router = useRouter();
  const [tab, setTab] = useState<MainTab>('history');
  const [filter, setFilter] = useState<FilterChip>('MONTH');
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceMode, setBalanceMode] = useState<CashBalanceMode>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<InitialCashData | null>(null);
  const [txToDelete, setTxToDelete] = useState<InitialCashData | null>(null);

  const loadData = useCallback(async () => {
    const [wallets, history] = await Promise.all([
      walletService.getBankWallets(),
      transactionService.getTransactionHistory(walletId.toString() as any),
    ]);

    const target = wallets.find(w => w.id === walletId);
    if (target) {
      setWallet(target);
    }
    
    setTransactions(
      (history || [])
        .map(mapCashHistoryToItem)
        .filter((item): item is TransactionItem => item != null)
    );
  }, [walletId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        await loadData();
      } catch (e: any) {
        if (active) {
          Alert.alert('Lỗi', e?.message || 'Không tải được dữ liệu sổ tay');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadData]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
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
        await transactionService.updateManualTransaction(selectedTransaction.transactionCode, {
          amount,
          type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
          categoryId,
          note,
          walletId,
        });
      } else {
        await transactionService.createManualTransaction({
          amount,
          type: balanceMode === 'add' ? 'INCOME' : 'EXPENSE',
          categoryId,
          note,
          walletId,
        });
      }
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không ghi được giao dịch');
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
      await loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không xóa được giao dịch');
    } finally {
      setSaving(false);
      setTxToDelete(null);
    }
  };

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={{ paddingBottom: 24 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {wallet ? wallet.name : 'Chi tiết sổ tay'}
            </Text>
          </View>
        </View>

        <View style={styles.balanceWrap}>
          <Text style={styles.balanceLabel}>SỐ DƯ HIỆN TẠI</Text>
          <Text style={styles.balanceText}>
            {wallet ? Number(wallet.balance).toLocaleString('vi-VN') : '0'} ₫
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnReceive}
            activeOpacity={0.8}
            onPress={() => openBalanceModal('add')}
          >
            <Feather name="plus-circle" size={16} color={PASTEL_PALETTE.accentDeep} />
            <Text style={styles.actionTextReceive}>Thu nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSpend}
            activeOpacity={0.8}
            onPress={() => openBalanceModal('spend')}
          >
            <Feather name="minus-circle" size={16} color="#DC2626" />
            <Text style={styles.actionTextSpend}>Chi tiêu</Text>
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      <View style={styles.content}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Lịch sử
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'report' && styles.tabActive]}
            onPress={() => setTab('report')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'report' && styles.tabTextActive]}>
              Báo cáo
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : tab === 'history' ? (
          <>
            <View style={styles.filterRow}>
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFilter(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
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
              <RecentTransactions 
                transactions={visibleTransactions} 
                listTitle="Giao dịch tài khoản"
                emptyTitle="Chưa có giao dịch"
                emptySubtitle="Bấm nút thu hoặc chi để thêm giao dịch đầu tiên."
                onPressItem={(tx) => {
                  if (!tx.id) return;
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
        currentBalance={wallet?.balance ? Number(wallet.balance) : 0}
        saving={saving}
        initialData={selectedTransaction || undefined}
        onClose={() => setBalanceModalVisible(false)}
        onConfirm={handleCashBalanceChange}
        onDelete={() => selectedTransaction && handleDeleteTransaction(selectedTransaction)}
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
};
