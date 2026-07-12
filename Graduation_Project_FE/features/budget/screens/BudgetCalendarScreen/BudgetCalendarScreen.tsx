import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../shared/constants/Colors';
import { styles, CAL_CELL_SIZE } from './BudgetCalendarScreen.styles';

// ─── DEMO DATA (thay bằng API thực tế sau) ─────────────────────────────────
type TxItem = {
  id: string;
  title: string;
  amount: number; // âm = chi, dương = thu
  date: string;   // 'dd/MM/yyyy, HH:mm'
  icon: string;
  category: string;
  type: 'topup' | 'payment' | 'withdraw';
};

const MOCK_TRANSACTIONS: TxItem[] = [
  { id: '1', title: 'Nạp tiền vào ví',        amount: 500000,  date: '18/06/2026, 14:30', icon: 'add-circle',       category: 'Nạp tiền',   type: 'topup' },
  { id: '2', title: 'Thanh toán Highlands',    amount: -55000,  date: '17/06/2026, 09:15', icon: 'cafe',             category: 'Ăn uống',    type: 'payment' },
  { id: '3', title: 'Rút tiền về ngân hàng',   amount: -100000, date: '10/06/2026, 16:45', icon: 'cash',             category: 'Rút tiền',   type: 'withdraw' },
  { id: '4', title: 'Thanh toán Shopee',        amount: -320000, date: '08/06/2026, 20:00', icon: 'cart',             category: 'Mua sắm',    type: 'payment' },
  { id: '5', title: 'Nạp tiền vào ví',         amount: 200000,  date: '05/06/2026, 11:20', icon: 'add-circle',       category: 'Nạp tiền',   type: 'topup' },
  { id: '6', title: 'Chuyển tiền cho bạn bè',  amount: -150000, date: '22/06/2026, 18:30', icon: 'swap-horizontal',  category: 'Chuyển tiền',type: 'payment' },
  { id: '7', title: 'Nhận tiền từ người thân', amount: 1000000, date: '22/06/2026, 09:00', icon: 'download',         category: 'Nhận tiền',  type: 'topup' },
  { id: '8', title: 'Ăn sáng',                 amount: -35000,  date: '22/06/2026, 07:30', icon: 'fast-food',        category: 'Ăn uống',    type: 'payment' },
  { id: '9', title: 'Mua sắm quần áo',         amount: -450000, date: '15/06/2026, 14:00', icon: 'pricetag',         category: 'Mua sắm',    type: 'payment' },
  { id: '10',title: 'Cà phê cùng bạn',         amount: -70000,  date: '20/06/2026, 10:30', icon: 'cafe',             category: 'Ăn uống',    type: 'payment' },
  { id: '11',title: 'Tiền lương tháng 6',      amount: 8000000, date: '01/06/2026, 08:00', icon: 'cash',             category: 'Thu nhập',   type: 'topup' },
  { id: '12',title: 'Điện tháng 6',            amount: -320000, date: '03/06/2026, 10:00', icon: 'bulb',             category: 'Hóa đơn',    type: 'payment' },
  { id: '13',title: 'Đi grab',                 amount: -45000,  date: '25/06/2026, 17:00', icon: 'car',              category: 'Di chuyển',  type: 'payment' },
  { id: '14',title: 'Nạp điện thoại',          amount: -100000, date: '25/06/2026, 09:20', icon: 'phone-portrait',   category: 'Tiện ích',   type: 'payment' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const parseTxDate = (dateStr: string): Date => {
  const [datePart, timePart] = dateStr.split(', ');
  const [d, m, y] = datePart.split('/');
  const [h, min] = timePart.split(':');
  return new Date(+y, +m - 1, +d, +h, +min);
};

const fmt = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n < 0 ? '-' : '+') + (abs / 1_000_000).toFixed(1) + 'tr';
  if (abs >= 1_000) return (n < 0 ? '-' : '+') + Math.round(abs / 1_000) + 'k';
  return (n < 0 ? '-' : '+') + abs + 'đ';
};

const fmtFull = (n: number): string =>
  (n >= 0 ? '+' : '') + n.toLocaleString('vi-VN') + 'đ';

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay(); // 0=Sun

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_NAMES_FULL = ['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const MONTH_SHORT = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const MODE_LABELS = ['Ngày', 'Tuần', 'Tháng', 'Năm'] as const;
type Mode = typeof MODE_LABELS[number];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export const BudgetCalendarScreen = () => {
  const router = useRouter();
  const today = new Date();

  const [mode, setMode] = useState<Mode>('Tháng');
  const [cursor, setCursor] = useState(new Date(today)); // current anchor date
  const [selectedDate, setSelectedDate] = useState(toYMD(today));

  // Map transactions by date string YYYY-MM-DD
  const txByDate = useMemo(() => {
    const map: Record<string, TxItem[]> = {};
    MOCK_TRANSACTIONS.forEach(tx => {
      const d = parseTxDate(tx.date);
      const key = toYMD(d);
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return map;
  }, []);

  // Transactions for current month (for month/year)
  const txForMonth = (year: number, month: number) =>
    MOCK_TRANSACTIONS.filter(tx => {
      const d = parseTxDate(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

  const navigate = (delta: number) => {
    setCursor(prev => {
      const d = new Date(prev);
      if (mode === 'Ngày') d.setDate(d.getDate() + delta);
      else if (mode === 'Tuần') d.setDate(d.getDate() + 7 * delta);
      else if (mode === 'Tháng') d.setMonth(d.getMonth() + delta);
      else d.setFullYear(d.getFullYear() + delta);
      return d;
    });
  };

  const navLabel = useMemo(() => {
    if (mode === 'Ngày') {
      const dow = DAY_NAMES_FULL[cursor.getDay()];
      return `${dow}, ${cursor.getDate()}/${cursor.getMonth() + 1}/${cursor.getFullYear()}`;
    }
    if (mode === 'Tuần') {
      const startOfWeek = new Date(cursor);
      startOfWeek.setDate(cursor.getDate() - cursor.getDay());
      const end = new Date(startOfWeek); end.setDate(end.getDate() + 6);
      return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    }
    if (mode === 'Tháng') {
      return `Tháng ${cursor.getMonth() + 1}/${cursor.getFullYear()}`;
    }
    return `Năm ${cursor.getFullYear()}`;
  }, [mode, cursor]);

  // ── Summary for current view ─────────────────────────────────────────────
  const viewTx = useMemo(() => {
    const ymd = toYMD(cursor);
    if (mode === 'Ngày') return txByDate[ymd] ?? [];
    if (mode === 'Tuần') {
      const startOfWeek = new Date(cursor);
      startOfWeek.setDate(cursor.getDate() - cursor.getDay());
      return MOCK_TRANSACTIONS.filter(tx => {
        const d = parseTxDate(tx.date);
        const dow = new Date(d); dow.setHours(0, 0, 0, 0);
        const s = new Date(startOfWeek); s.setHours(0, 0, 0, 0);
        const e = new Date(s); e.setDate(s.getDate() + 6);
        return dow >= s && dow <= e;
      });
    }
    if (mode === 'Tháng') return txForMonth(cursor.getFullYear(), cursor.getMonth());
    return MOCK_TRANSACTIONS.filter(tx => parseTxDate(tx.date).getFullYear() === cursor.getFullYear());
  }, [mode, cursor, txByDate]);

  const totalIncome = viewTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = viewTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // ── MONTH VIEW ───────────────────────────────────────────────────────────
  const renderMonthView = () => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0=Sun
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedTx = txByDate[selectedDate] ?? [];

    return (
      <>
        <View style={styles.calendarContainer}>
          {/* Day names */}
          <View style={styles.dayNames}>
            {DAY_NAMES.map((n, i) => (
              <Text key={n} style={[styles.dayName, i === 0 && styles.dayNameSun]}>{n}</Text>
            ))}
          </View>
          {/* Grid */}
          <View style={styles.calendarGrid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={styles.dayCell} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTx = txByDate[dateStr] ?? [];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === toYMD(today);
              const isSun = new Date(year, month, day).getDay() === 0;
              const dayIncome = dayTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
              const dayExpense = dayTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(dateStr)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayCellInner,
                    isSelected && styles.dayCellSelected,
                    !isSelected && isToday && styles.dayCellToday,
                  ]}>
                    <Text style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                      !isSelected && isSun && styles.dayNumberSun,
                      !isSelected && isToday && styles.dayNumberToday,
                    ]}>
                      {day}
                    </Text>
                    {dayTx.length > 0 && (
                      <View style={styles.dayDots}>
                        {dayExpense > 0 && <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : Colors.error }]} />}
                        {dayIncome > 0 && <View style={[styles.dot, { backgroundColor: isSelected ? '#dfffee' : Colors.success }]} />}
                      </View>
                    )}
                    {dayTx.length > 0 && (
                      <Text style={[styles.dayAmount, { color: isSelected ? '#fff' : (dayExpense > dayIncome ? Colors.error : Colors.success) }]}>
                        {fmt(dayIncome - dayExpense)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Transactions for selected date */}
        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>
            Giao dịch ngày {selectedDate.split('-').reverse().join('/')}
          </Text>
          {selectedTx.length === 0 ? (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={44} color={Colors.border} />
              <Text style={styles.emptyTxText}>Không có giao dịch nào</Text>
            </View>
          ) : (
            selectedTx.map(tx => renderTxItem(tx))
          )}
        </View>
      </>
    );
  };

  // ── WEEK VIEW ────────────────────────────────────────────────────────────
  const renderWeekView = () => {
    const startOfWeek = new Date(cursor);
    startOfWeek.setDate(cursor.getDate() - cursor.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = toYMD(d);
      const txs = txByDate[key] ?? [];
      const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      return { d, key, txs, income, expense };
    });

    const maxVal = Math.max(...days.map(d => Math.max(d.income, d.expense)), 1);
    const selectedDayTx = txByDate[selectedDate] ?? [];

    return (
      <>
        <View style={styles.weekContainer}>
          <View style={styles.weekRow}>
            {days.map(({ d, key, income, expense }, i) => {
              const isSelected = key === selectedDate;
              const isSun = d.getDay() === 0;
              const expenseH = (expense / maxVal) * 100;
              const incomeH = (income / maxVal) * 100;
              return (
                <TouchableOpacity key={key} style={styles.weekBarCol} onPress={() => setSelectedDate(key)} activeOpacity={0.7}>
                  <View style={styles.weekBarWrapper}>
                    {income > 0 && (
                      <View style={[styles.weekBar, { height: incomeH, backgroundColor: Colors.success + (isSelected ? 'FF' : '99') }]} />
                    )}
                    {expense > 0 && (
                      <View style={[styles.weekBar, { height: expenseH, backgroundColor: Colors.error + (isSelected ? 'FF' : '99') }]} />
                    )}
                  </View>
                  <Text style={[styles.weekDayLabel, isSelected && styles.weekDayLabelSelected, isSun && { color: Colors.error }]}>
                    {DAY_NAMES[i]}
                  </Text>
                  <Text style={styles.weekDayDate}>{d.getDate()}/{d.getMonth() + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Legend */}
          <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.error }} />
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>Chi tiêu</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.success }} />
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>Thu nhập</Text>
            </View>
          </View>
        </View>

        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>
            Giao dịch ngày {selectedDate.split('-').reverse().join('/')}
          </Text>
          {selectedDayTx.length === 0 ? (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={44} color={Colors.border} />
              <Text style={styles.emptyTxText}>Không có giao dịch nào</Text>
            </View>
          ) : selectedDayTx.map(tx => renderTxItem(tx))}
        </View>
      </>
    );
  };

  // ── DAY VIEW ─────────────────────────────────────────────────────────────
  const renderDayView = () => {
    const ymd = toYMD(cursor);
    setSelectedDate(ymd);
    const dayTxs = (txByDate[ymd] ?? []).slice().sort((a, b) =>
      parseTxDate(a.date).getTime() - parseTxDate(b.date).getTime()
    );

    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      txs: dayTxs.filter(tx => parseTxDate(tx.date).getHours() === h),
    })).filter(({ hour, txs }) => txs.length > 0 || (hour >= 7 && hour <= 22));

    return (
      <View style={styles.timelineContainer}>
        {hours.length === 0 ? (
          <View style={styles.emptyTx}>
            <Ionicons name="receipt-outline" size={44} color={Colors.border} />
            <Text style={styles.emptyTxText}>Không có giao dịch nào trong ngày này</Text>
          </View>
        ) : (
          hours.map(({ hour, txs }) => (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeLabel}>{String(hour).padStart(2, '0')}:00</Text>
              <View style={styles.timeContent}>
                {txs.map(tx => (
                  <View key={tx.id} style={styles.timeTransaction}>
                    <View style={[styles.timeTransactionIcon, {
                      backgroundColor: tx.amount > 0 ? Colors.success + '22' : Colors.error + '22',
                    }]}>
                      <Ionicons name={tx.icon as any} size={16} color={tx.amount > 0 ? Colors.success : Colors.error} />
                    </View>
                    <Text style={styles.timeTransactionTitle} numberOfLines={1}>{tx.title}</Text>
                    <Text style={[styles.timeTransactionAmount, { color: tx.amount > 0 ? Colors.success : Colors.error }]}>
                      {fmtFull(tx.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  // ── YEAR VIEW ─────────────────────────────────────────────────────────────
  const renderYearView = () => {
    const year = cursor.getFullYear();
    const months = Array.from({ length: 12 }, (_, m) => {
      const txs = txForMonth(year, m);
      const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      return { m, income, expense };
    });
    const maxExpense = Math.max(...months.map(m => m.expense), 1);
    const currentM = today.getMonth();
    const currentY = today.getFullYear();

    return (
      <View style={styles.yearGrid}>
        {months.map(({ m, income, expense }) => {
          const isCurrentMonth = year === currentY && m === currentM;
          const isCursorMonth = year === cursor.getFullYear() && m === cursor.getMonth();
          const hasData = income > 0 || expense > 0;
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.yearMonthCard,
                isCurrentMonth && styles.yearMonthCardCurrent,
                isCursorMonth && styles.yearMonthCardSelected,
              ]}
              onPress={() => {
                setCursor(new Date(year, m, 1));
                setMode('Tháng');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.yearMonthLabel, isCursorMonth && styles.yearMonthLabelSelected]}>
                {MONTH_SHORT[m]}
              </Text>
              {hasData ? (
                <>
                  <Text style={styles.yearMonthExpense}>-{(expense / 1000).toFixed(0)}k</Text>
                  <Text style={styles.yearMonthIncome}>+{(income / 1000).toFixed(0)}k</Text>
                  <View style={styles.yearMonthBar}>
                    <View style={[styles.yearMonthBarFill, { width: `${(expense / maxExpense) * 100}%` }]} />
                  </View>
                </>
              ) : (
                <Text style={styles.yearMonthEmpty}>—</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ── TX ITEM ───────────────────────────────────────────────────────────────
  const renderTxItem = (tx: TxItem) => (
    <View key={tx.id} style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? Colors.success + '22' : Colors.error + '22' }]}>
        <Ionicons name={tx.icon as any} size={20} color={tx.amount > 0 ? Colors.success : Colors.error} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
        <Text style={styles.txDate}>{tx.date} · {tx.category}</Text>
      </View>
      <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success : Colors.error }]}>
        {fmtFull(tx.amount)}
      </Text>
    </View>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          {/* Top row */}
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lịch Chi Tiêu</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => { setCursor(new Date(today)); setSelectedDate(toYMD(today)); }} activeOpacity={0.7}>
              <Ionicons name="today-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            {MODE_LABELS.map(m => (
              <TouchableOpacity key={m} style={[styles.modeTab, mode === m && styles.modeTabActive]} onPress={() => setMode(m)} activeOpacity={0.7}>
                <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* Navigator */}
      <View style={styles.navigator}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigate(-1)}>
          <Ionicons name="chevron-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navLabel}>{navLabel}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigate(1)}>
          <Ionicons name="chevron-forward" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Thu nhập</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {totalIncome > 0 ? '+' + (totalIncome / 1000).toFixed(0) + 'k' : '0'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Chi tiêu</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            {totalExpense > 0 ? '-' + (totalExpense / 1000).toFixed(0) + 'k' : '0'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Số dư</Text>
          <Text style={[styles.summaryValue, { color: balance >= 0 ? Colors.primary : Colors.error }]}>
            {balance >= 0 ? '+' : ''}{(balance / 1000).toFixed(0)}k
          </Text>
        </View>
      </View>

      {/* Main content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'Tháng' && renderMonthView()}
        {mode === 'Tuần' && renderWeekView()}
        {mode === 'Ngày' && renderDayView()}
        {mode === 'Năm' && renderYearView()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default BudgetCalendarScreen;
