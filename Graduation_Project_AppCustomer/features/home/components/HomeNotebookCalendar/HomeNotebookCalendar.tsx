import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { useToast } from '@/shared/components/Toast'
import {
  createNotebookTransaction,
  getCashNotebook,
  getNotebookTransactions,
} from '@/shared/services/notebook.service'
import { AddTransactionModal } from '@/features/notebook/components/AddTransactionModal/AddTransactionModal'
import type {
  TransactionMode,
  TransactionPayload,
} from '@/features/notebook/types/transaction'
import { styles } from './HomeNotebookCalendar.styles'

const WEEKDAYS = [
  { key: 'T2', weekend: false },
  { key: 'T3', weekend: false },
  { key: 'T4', weekend: false },
  { key: 'T5', weekend: false },
  { key: 'T6', weekend: false },
  { key: 'T7', weekend: 'sat' as const },
  { key: 'CN', weekend: 'sun' as const },
]

type DayCell = {
  key: string
  date: Date | null
  day: number | null
  inMonth: boolean
  isToday: boolean
  isFuture: boolean
  logged: boolean
  weekday: number
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseTxDate(raw: string) {
  const match = String(raw || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function buildMonthCells(monthAnchor: Date, loggedKeys: Set<string>): DayCell[] {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const first = startOfMonth(monthAnchor)
  const mondayIndex = (first.getDay() + 6) % 7
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells: DayCell[] = []

  for (let i = 0; i < mondayIndex; i++) {
    cells.push({
      key: `pad-start-${i}`,
      date: null,
      day: null,
      inMonth: false,
      isToday: false,
      isFuture: false,
      logged: false,
      weekday: i,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(first.getFullYear(), first.getMonth(), day, 12)
    const key = toKey(date)
    const weekday = (date.getDay() + 6) % 7
    cells.push({
      key,
      date,
      day,
      inMonth: true,
      isToday: sameDay(date, today),
      isFuture: date > today,
      logged: loggedKeys.has(key),
      weekday,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `pad-end-${cells.length}`,
      date: null,
      day: null,
      inMonth: false,
      isToday: false,
      isFuture: false,
      logged: false,
      weekday: cells.length % 7,
    })
  }

  return cells
}

export function HomeNotebookCalendar() {
  const { showToast } = useToast()
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()))
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [bookId, setBookId] = useState<number | null>(null)
  const [balance, setBalance] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [pickVisible, setPickVisible] = useState(false)
  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<TransactionMode>('add')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const book = await getCashNotebook()
      setBookId(book.id)
      setBalance(Number(book.balance) || 0)
      const txs = await getNotebookTransactions(book.id, 'YEAR')
      const keys = new Set<string>()
      txs.forEach((tx) => {
        const d = parseTxDate(tx.createdAt)
        if (d) keys.add(toKey(d))
      })
      setLoggedKeys(keys)
    } catch {
      setLoggedKeys(new Set())
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const cells = useMemo(
    () => buildMonthCells(monthAnchor, loggedKeys),
    [monthAnchor, loggedKeys],
  )

  const monthLabel = `Tháng ${monthAnchor.getMonth() + 1}/${monthAnchor.getFullYear()}`

  const canGoNext = () => {
    const now = startOfMonth(new Date())
    const next = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1)
    return next <= now
  }

  const shiftMonth = (dir: -1 | 1) => {
    const next = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + dir, 1)
    if (dir > 0 && next > startOfMonth(new Date())) return
    setMonthAnchor(next)
  }

  const openDay = (cell: DayCell) => {
    if (!cell.date || !cell.inMonth) return

    if (cell.isFuture) {
      const today = new Date()
      const targetLabel = `${cell.date.getDate()}/${cell.date.getMonth() + 1}/${cell.date.getFullYear()}`
      const todayLabel = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
      showToast({
        title: 'Chưa đến ngày',
        message: `Chưa đến ngày ${targetLabel}. Hôm nay là ngày ${todayLabel}.`,
        variant: 'warning',
      })
      return
    }

    setSelectedDate(cell.date)
    setPickVisible(true)
  }

  const openEditor = (mode: TransactionMode) => {
    setPickVisible(false)
    setEditorMode(mode)
    setEditorVisible(true)
  }

  const handleConfirm = async (payload: TransactionPayload) => {
    if (!bookId || !selectedDate) return
    try {
      setSaving(true)
      await createNotebookTransaction({
        amount: payload.amount,
        type: editorMode === 'spend' ? 'EXPENSE' : 'INCOME',
        categoryId: payload.category.id,
        note: payload.note,
        bookId,
        entryDate: toKey(selectedDate),
      })
      setEditorVisible(false)
      await load()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không ghi chép được')
    } finally {
      setSaving(false)
    }
  }

  const selectedLabel = selectedDate
    ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
    : ''

  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sổ tay nhanh</Text>
        <Text style={styles.subtitle}>Chạm ngày để ghi thu / chi</Text>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(-1)} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={18} color={PASTEL_PALETTE.title} />
        </TouchableOpacity>
        <Text style={styles.navMonth}>{monthLabel}</Text>
        <TouchableOpacity
          style={[styles.navBtn, !canGoNext() && { opacity: 0.35 }]}
          onPress={() => shiftMonth(1)}
          disabled={!canGoNext()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.title} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <Text
              key={d.key}
              style={[
                styles.weekday,
                d.weekend === 'sat' && styles.weekdaySat,
                d.weekend === 'sun' && styles.weekdaySun,
              ]}
            >
              {d.key}
            </Text>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <View style={styles.grid}>
            {cells.map((cell) => {
              if (!cell.inMonth || !cell.date) {
                return <View key={cell.key} style={styles.cellEmpty} />
              }
              const isSat = cell.weekday === 5
              const isSun = cell.weekday === 6
              return (
                <TouchableOpacity
                  key={cell.key}
                  style={[
                    styles.cell,
                    cell.isToday && styles.cellToday,
                    cell.isFuture && styles.cellFuture,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => openDay(cell)}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSat && styles.daySat,
                      isSun && styles.daySun,
                      cell.isToday && styles.dayToday,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {!cell.isFuture ? (
                    <Text
                      style={[
                        styles.status,
                        cell.logged ? styles.statusLogged : styles.statusEmpty,
                      ]}
                      numberOfLines={2}
                    >
                      {cell.logged ? 'Đã ghi chép' : 'Chưa ghi chép'}
                    </Text>
                  ) : (
                    <Text style={styles.statusMuted}>—</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>
      </View>

      <Modal visible={pickVisible} transparent animationType="fade" onRequestClose={() => setPickVisible(false)}>
        <Pressable style={styles.pickOverlay} onPress={() => setPickVisible(false)}>
          <Pressable style={styles.pickSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickTitle}>Ghi chép · {selectedLabel}</Text>
            <Text style={styles.pickHint}>Chọn loại giao dịch nhanh</Text>
            <TouchableOpacity
              style={[styles.pickBtn, styles.pickIncome]}
              activeOpacity={0.85}
              onPress={() => openEditor('add')}
            >
              <Ionicons name="add-circle-outline" size={20} color={PASTEL_PALETTE.accentDeep} />
              <Text style={styles.pickIncomeText}>Thu nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickBtn, styles.pickExpense]}
              activeOpacity={0.85}
              onPress={() => openEditor('spend')}
            >
              <Ionicons name="remove-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.pickExpenseText}>Chi tiêu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickCancel} onPress={() => setPickVisible(false)}>
              <Text style={styles.pickCancelText}>Hủy</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <AddTransactionModal
        visible={editorVisible}
        mode={editorMode}
        currentBalance={balance}
        saving={saving}
        onClose={() => setEditorVisible(false)}
        onConfirm={handleConfirm}
      />
    </View>
  )
}

export default HomeNotebookCalendar
