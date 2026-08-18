import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { WALLET_HISTORY_DATE_FILTERS } from '@/features/wallet/constants/filters'
import {
  getWalletHistoryRange,
  isSameWeek,
  parseWalletTxDate,
  startOfWeek,
  type WalletHistoryDateFilter,
} from '@/features/wallet/report/walletReportUtils'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { getBankMetaByName } from '@/shared/constants/commonBanks'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getWalletTransactions } from '@/shared/services'
import type { WalletTransactionResponse } from '@/shared/types/wallet'
import {
  shouldShowWalletHistoryDestination,
  walletHistoryDestination,
  walletHistoryUserNote,
} from '../utils/walletHistoryDisplay'
import { styles } from './HistoryScreen.styles'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseHistoryDate(iso: string) {
  return parseWalletTxDate({
    transactionCode: '',
    amount: 0,
    type: 'TOP_UP',
    note: null,
    categoryId: null,
    categoryName: null,
    categoryIcon: null,
    categoryColor: null,
    categoryBgColor: null,
    categoryDeleted: false,
    createdAt: iso,
  })
}

export default function HistoryScreen() {
  const router = useRouter()
  const hasLoadedRef = useRef(false)
  const [items, setItems] = useState<WalletTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState<WalletHistoryDateFilter>('day')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      setError('')
      const data = await getWalletTransactions()
      setItems(data)
      hasLoadedRef.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lịch sử')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load(hasLoadedRef.current)
    }, [load]),
  )

  const filtered = useMemo(() => {
    const { start, end } = getWalletHistoryRange(dateFilter, selectedDate)
    return items.filter((item) => {
      const d = parseHistoryDate(item.createdAt)
      return d >= start && d <= end
    })
  }, [items, dateFilter, selectedDate])

  function getDateLabel() {
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

  function shiftPeriod(dir: -1 | 1) {
    const next = new Date(selectedDate)
    if (dateFilter === 'day') next.setDate(next.getDate() + dir)
    else if (dateFilter === 'week') next.setDate(next.getDate() + dir * 7)
    else if (dateFilter === 'month') next.setMonth(next.getMonth() + dir)
    else next.setFullYear(next.getFullYear() + dir)
    if (next > new Date()) return
    setSelectedDate(next)
  }

  function canGoNext() {
    const probe = new Date(selectedDate)
    if (dateFilter === 'day') probe.setDate(probe.getDate() + 1)
    else if (dateFilter === 'week') probe.setDate(probe.getDate() + 7)
    else if (dateFilter === 'month') probe.setMonth(probe.getMonth() + 1)
    else probe.setFullYear(probe.getFullYear() + 1)
    return probe <= new Date()
  }

  function applyPickedDate(date?: Date) {
    if (!date) return
    const now = new Date()
    setSelectedDate(date > now ? now : date)
  }

  function openDetail(item: WalletTransactionResponse) {
    const matched = item.bankCode ? undefined : getBankMetaByName(item.bankName)

    router.push({
      pathname: '/wallet/withdraw-success',
      params: {
        source: 'history',
        type: item.type,
        transactionCode: item.transactionCode,
        amount: String(item.amount),
        createdAt: item.createdAt,
        bankName: item.bankName ?? '',
        bankCode: item.bankCode ?? matched?.code ?? '',
        bankAccountNumber: item.bankAccountNumber ?? '',
        accountName: item.bankAccountName ?? '',
        categoryName: item.categoryName ?? '',
        categoryIcon: item.categoryIcon ?? 'cash',
        categoryColor: item.categoryColor ?? PASTEL_PALETTE.accentDeep,
        categoryBgColor: item.categoryBgColor ?? PASTEL_PALETTE.accentSoft,
        note: item.note ?? '',
      },
    })
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Lịch sử ví</Text>
            <Text style={styles.subtitle}>{filtered.length} giao dịch</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <View style={styles.filterRow}>
        {WALLET_HISTORY_DATE_FILTERS.map((item) => {
          const active = dateFilter === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setDateFilter(item.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
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

      {loading ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.transactionCode}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          }
          renderItem={({ item }) => {
            const isTopUp = item.type === 'TOP_UP'
            const destination = walletHistoryDestination({
              categoryName: item.categoryName,
              note: item.note,
              type: item.type,
              bankName: item.bankName,
              fromHistory: true,
            })
            const userNote = walletHistoryUserNote(item.note, item.categoryName)
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => openDetail(item)}
              >
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: isTopUp
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(234,88,12,0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isTopUp ? 'arrow-down' : 'arrow-up'}
                    size={22}
                    color={isTopUp ? '#059669' : '#EA580C'}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>
                    {item.categoryName?.trim() || (isTopUp ? 'Nạp tiền' : 'Rút tiền')}
                  </Text>
                  <Text style={styles.rowMeta}>{formatDate(item.createdAt)}</Text>
                  {shouldShowWalletHistoryDestination(item.categoryName, item.note) ? (
                    <Text style={styles.rowMeta} numberOfLines={2}>
                      {destination}
                    </Text>
                  ) : null}
                  {userNote ? <Text style={styles.rowNote}>{userNote}</Text> : null}
                  <Text style={styles.detailHint}>Xem chi tiết</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={[styles.amount, { color: isTopUp ? '#059669' : '#EA580C' }]}>
                    {isTopUp ? '+' : '-'}
                    {Number(item.amount).toLocaleString('vi-VN')} ₫
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={PASTEL_PALETTE.lavender} />
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}
