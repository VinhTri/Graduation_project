import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import {
  NOTEBOOK_HISTORY_DATE_FILTERS,
  type NotebookContentTab,
  type NotebookHistoryDateFilter,
} from '../../constants/filters'
import type { NotebookBookState } from '../../hooks/useNotebookBook'
import {
  getNotebookHistoryRange,
  isSameWeek,
  parseNotebookTxDate,
  startOfWeek,
} from '../../report/notebookReportUtils'
import { AddTransactionModal } from '../AddTransactionModal/AddTransactionModal'
import { NotebookReport } from '../NotebookReport/NotebookReport'
import { RecentTransactions } from '../RecentTransactions/RecentTransactions'
import { styles } from './NotebookBookPanel.styles'

type NotebookBookPanelProps = {
  state: NotebookBookState
  contentTab: NotebookContentTab
  listTitle?: string
  emptyTitle?: string
  emptySubtitle?: string
}

export function NotebookBookPanel({
  state,
  contentTab,
  listTitle,
  emptyTitle,
  emptySubtitle,
}: NotebookBookPanelProps) {
  const {
    balance,
    transactions,
    loading,
    refreshing,
    saving,
    editorVisible,
    editorMode,
    editingTx,
    txToDelete,
    refresh,
    openTransactionDetail,
    closeEditor,
    saveTransaction,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = state

  const [dateFilter, setDateFilter] = useState<NotebookHistoryDateFilter>('day')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)

  const filteredTransactions = useMemo(() => {
    const { start, end } = getNotebookHistoryRange(dateFilter, selectedDate)
    return transactions.filter((tx) => {
      const d = parseNotebookTxDate(tx)
      return d >= start && d <= end
    })
  }, [transactions, dateFilter, selectedDate])

  const getDateLabel = () => {
    const now = new Date()
    if (dateFilter === 'day') {
      if (
        selectedDate.getDate() === now.getDate() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getFullYear() === now.getFullYear()
      ) {
        return 'Hôm nay'
      }
      return selectedDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
    if (dateFilter === 'week') {
      if (isSameWeek(selectedDate, now)) return 'Tuần này'
      const start = startOfWeek(selectedDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
    }
    if (dateFilter === 'month') {
      if (
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getFullYear() === now.getFullYear()
      ) {
        return 'Tháng này'
      }
      return `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
    }
    if (selectedDate.getFullYear() === now.getFullYear()) return 'Năm nay'
    return `Năm ${selectedDate.getFullYear()}`
  }

  const shiftPeriod = (dir: -1 | 1) => {
    const next = new Date(selectedDate)
    if (dateFilter === 'day') next.setDate(next.getDate() + dir)
    else if (dateFilter === 'week') next.setDate(next.getDate() + dir * 7)
    else if (dateFilter === 'month') next.setMonth(next.getMonth() + dir)
    else next.setFullYear(next.getFullYear() + dir)
    if (next > new Date()) return
    setSelectedDate(next)
  }

  const canGoNext = () => {
    const probe = new Date(selectedDate)
    if (dateFilter === 'day') probe.setDate(probe.getDate() + 1)
    else if (dateFilter === 'week') probe.setDate(probe.getDate() + 7)
    else if (dateFilter === 'month') probe.setMonth(probe.getMonth() + 1)
    else probe.setFullYear(probe.getFullYear() + 1)
    return probe <= new Date()
  }

  const applyPickedDate = (date?: Date) => {
    if (!date) return
    const now = new Date()
    setSelectedDate(date > now ? now : date)
  }

  return (
    <>
      <View style={styles.content}>
        {contentTab === 'history' ? (
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
            </View>
          ) : (
            <>
              <View style={styles.filterRow}>
                {NOTEBOOK_HISTORY_DATE_FILTERS.map((item) => {
                  const active = dateFilter === item.key
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDateFilter(item.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={styles.dateSelector}>
                <TouchableOpacity
                  style={styles.dateNavBtn}
                  onPress={() => shiftPeriod(-1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={PASTEL_PALETTE.title} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTextContainer}
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color={PASTEL_PALETTE.title} />
                  <Text style={styles.dateText}>{getDateLabel()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateNavBtn, !canGoNext() && { opacity: 0.4 }]}
                  onPress={() => shiftPeriod(1)}
                  disabled={!canGoNext()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.title} />
                </TouchableOpacity>
              </View>

              {showPicker && Platform.OS !== 'ios' ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowPicker(false)
                    applyPickedDate(date)
                  }}
                  maximumDate={new Date()}
                />
              ) : null}

              {Platform.OS === 'ios' ? (
                <Modal visible={showPicker} transparent animationType="slide">
                  <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPicker(false)}
                  >
                    <TouchableWithoutFeedback>
                      <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                          <Text style={styles.pickerTitle}>Chọn ngày lịch sử</Text>
                          <TouchableOpacity onPress={() => setShowPicker(false)}>
                            <Text style={styles.pickerDone}>Xong</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="inline"
                            onChange={(_, date) => applyPickedDate(date)}
                            maximumDate={new Date()}
                            locale="vi-VN"
                            themeVariant="light"
                            style={{ alignSelf: 'center' }}
                          />
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </TouchableOpacity>
                </Modal>
              ) : null}

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    tintColor={PASTEL_PALETTE.accentDeep}
                  />
                }
              >
                <RecentTransactions
                  transactions={filteredTransactions}
                  listTitle={listTitle}
                  emptyTitle={emptyTitle}
                  emptySubtitle={emptySubtitle}
                  onPressItem={(tx) => {
                    openTransactionDetail(tx.id, tx.type)
                  }}
                  onDeleteItem={(tx) => {
                    requestDelete({
                      transactionCode: tx.id,
                      amount: tx.amount,
                      note: tx.note,
                      categoryId: tx.categoryId,
                      categoryName: tx.categoryName,
                    })
                  }}
                />
              </ScrollView>
            </>
          )
        ) : (
          <View style={styles.reportWrap}>
            <NotebookReport active={contentTab === 'report'} />
          </View>
        )}
      </View>

      <AddTransactionModal
        visible={editorVisible}
        mode={editorMode}
        currentBalance={balance}
        saving={saving}
        initialData={editingTx}
        onClose={closeEditor}
        onConfirm={saveTransaction}
      />

      <ConfirmModal
        visible={!!txToDelete}
        title="Xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này không? Số dư sổ tay sẽ được hoàn lại tự động."
        isDestructive
        confirmText="Xóa"
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  )
}
