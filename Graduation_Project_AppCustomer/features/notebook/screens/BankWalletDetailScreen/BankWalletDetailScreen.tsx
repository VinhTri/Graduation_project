import React, { useCallback, useMemo, useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Feather, Ionicons } from '@expo/vector-icons'
import { styles } from './BankWalletDetailScreen.styles'
import { RecentTransactions } from '../../components/RecentTransactions/RecentTransactions'
import { NotebookReport } from '../../components/NotebookReport/NotebookReport'
import { PastelHeaderShell } from '../../../../shared/components/PastelHeaderShell'
import {
  AddTransactionModal,
  type InitialTransactionData,
  type TransactionMode,
  type TransactionPayload,
} from '../../components/AddTransactionModal/AddTransactionModal'
import { walletService, WalletData } from '../../../../shared/api/services/walletService'
import { transactionService } from '../../../../shared/api/services/transactionService'
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette'
import { ConfirmModal } from '../../../../shared/components'
import Colors from '../../../../shared/constants/Colors'
import {
  filterNotebookItemsByHistoryRange,
  mapBankHistoryToNotebookItem,
  toInitialTransactionData,
} from '../../utils/bankHistoryMappers'
import type { NotebookTransactionItem } from '../../utils/notebookMappers'
import {
  NOTEBOOK_HISTORY_DATE_FILTERS,
  type NotebookHistoryDateFilter,
} from '../../constants/filters'
import { styles as panelStyles } from '../../components/NotebookBookPanel/NotebookBookPanel.styles'

type MainTab = 'history' | 'report'

interface Props {
  walletId: number
}

export const BankWalletDetailScreen = ({ walletId }: Props) => {
  const router = useRouter()
  const [tab, setTab] = useState<MainTab>('history')
  const [dateFilter, setDateFilter] = useState<NotebookHistoryDateFilter>('month')
  const [selectedDate] = useState<Date>(new Date())

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<NotebookTransactionItem[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [balanceModalVisible, setBalanceModalVisible] = useState(false)
  const [balanceMode, setBalanceMode] = useState<TransactionMode>('add')
  const [selectedTransaction, setSelectedTransaction] = useState<InitialTransactionData | null>(null)
  const [txToDelete, setTxToDelete] = useState<InitialTransactionData | null>(null)
  const [confirmDeleteWalletVisible, setConfirmDeleteWalletVisible] = useState(false)

  const loadData = useCallback(async () => {
    const [wallets, history] = await Promise.all([
      walletService.getBankWallets(),
      transactionService.getTransactionHistory(String(walletId)),
    ])

    const target = wallets.find((w) => w.id === walletId)
    if (target) setWallet(target)

    setTransactions(
      (history || [])
        .map(mapBankHistoryToNotebookItem)
        .filter((item): item is NotebookTransactionItem => item != null),
    )
  }, [walletId])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        await loadData()
      } catch (e: any) {
        if (active) {
          Alert.alert('Lỗi', e?.message || 'Không tải được dữ liệu sổ tay')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [loadData])

  const onRefresh = async () => {
    try {
      setRefreshing(true)
      await loadData()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không làm mới được dữ liệu')
    } finally {
      setRefreshing(false)
    }
  }

  const visibleTransactions = useMemo(
    () => filterNotebookItemsByHistoryRange(transactions, dateFilter, selectedDate),
    [dateFilter, selectedDate, transactions],
  )

  const openBalanceModal = (mode: TransactionMode, txData?: InitialTransactionData) => {
    setBalanceMode(mode)
    setSelectedTransaction(txData || null)
    setBalanceModalVisible(true)
  }

  const handleConfirm = async ({ amount, note, category }: TransactionPayload) => {
    const categoryId = Number(category.id)
    if (!categoryId || Number.isNaN(categoryId)) {
      Alert.alert('Lỗi', 'Danh mục không hợp lệ')
      throw new Error('Invalid category')
    }

    try {
      setSaving(true)
      const payload = {
        amount,
        type: (balanceMode === 'add' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
        categoryId,
        note,
        walletId,
      }
      if (selectedTransaction) {
        await transactionService.updateManualTransaction(selectedTransaction.transactionCode, payload)
      } else {
        await transactionService.createManualTransaction(payload)
      }
      await loadData()
      setBalanceModalVisible(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không ghi được giao dịch')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteTransaction = async () => {
    if (!txToDelete) return
    try {
      setSaving(true)
      await transactionService.deleteManualTransaction(txToDelete.transactionCode)
      setBalanceModalVisible(false)
      await loadData()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không xóa được giao dịch')
    } finally {
      setSaving(false)
      setTxToDelete(null)
    }
  }

  const confirmDeleteWallet = async () => {
    try {
      setSaving(true)
      await walletService.deleteManualBank(walletId)
      setConfirmDeleteWalletVisible(false)
      router.back()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể xóa sổ tay')
    } finally {
      setSaving(false)
    }
  }

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
          {wallet?.walletType === 'MANUAL' && (
            <TouchableOpacity
              onPress={() => setConfirmDeleteWalletVisible(true)}
              style={styles.deleteWalletBtn}
            >
              <Ionicons name="trash-outline" size={24} color="#DC2626" />
            </TouchableOpacity>
          )}
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
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Lịch sử</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'report' && styles.tabActive]}
            onPress={() => setTab('report')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'report' && styles.tabTextActive]}>Báo cáo</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : tab === 'history' ? (
          <>
            <View style={panelStyles.filterRow}>
              {NOTEBOOK_HISTORY_DATE_FILTERS.map((item) => {
                const active = dateFilter === item.key
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[panelStyles.chip, active && panelStyles.chipActive]}
                    onPress={() => setDateFilter(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[panelStyles.chipText, active && panelStyles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={PASTEL_PALETTE.accentDeep}
                />
              }
            >
              <RecentTransactions
                transactions={visibleTransactions}
                listTitle="Giao dịch tài khoản"
                emptyTitle="Chưa có giao dịch"
                emptySubtitle="Bấm nút thu hoặc chi để thêm giao dịch đầu tiên."
                onPressItem={(tx) => {
                  openBalanceModal(tx.type === 'INCOME' ? 'add' : 'spend', toInitialTransactionData(tx))
                }}
                onDeleteItem={(tx) => setTxToDelete(toInitialTransactionData(tx))}
              />
            </ScrollView>
          </>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={PASTEL_PALETTE.accentDeep}
              />
            }
          >
            <NotebookReport transactions={transactions} />
          </ScrollView>
        )}
      </View>

      <AddTransactionModal
        visible={balanceModalVisible}
        mode={balanceMode}
        currentBalance={wallet?.balance ? Number(wallet.balance) : 0}
        saving={saving}
        initialData={selectedTransaction}
        onClose={() => setBalanceModalVisible(false)}
        onConfirm={handleConfirm}
      />

      <ConfirmModal
        visible={!!txToDelete}
        title="Xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này không? Số dư sổ tay sẽ được hoàn lại tự động."
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setTxToDelete(null)}
      />

      <ConfirmModal
        visible={confirmDeleteWalletVisible}
        title="Xóa sổ tay"
        message={wallet ? `Bạn có chắc chắn muốn xóa sổ tay ngân hàng "${wallet.name}" không?` : ''}
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDeleteWallet}
        onCancel={() => setConfirmDeleteWalletVisible(false)}
      />
    </View>
  )
}
