import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext'
import { useMoneyFormat } from '@/shared/contexts/MoneyFormatContext'
import { useToast } from '@/shared/components/Toast'
import { WalletReport } from '@/features/wallet/report'
import { NotebookReport } from '@/features/notebook/report'
import type { FinanceAmountDelta, FinanceCenterPeriod } from '@/shared/api/services/reportService'
import { useFinanceCenter } from '../hooks/useFinanceCenter'
import {
  buildExportText,
  buildInsights,
  canGoNextPeriod,
  clampShare,
  flowVolume,
  formatDeltaPercent,
  num,
  periodLabel,
  previousPeriodDate,
  shiftPeriod,
} from '../utils'
import { styles } from './finance-center.styles'

type TabKey = 'overview' | 'wallet' | 'notebook'

const WALLET_COLOR = PASTEL_PALETTE.accentDeep
const CASH_COLOR = PASTEL_PALETTE.lavender
const CURRENT_BAR = PASTEL_PALETTE.accentDeep
const COMPARE_BAR = '#C4B5FD'

export default function FinanceCenterScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { language } = useLanguage()
  const { formatMoney } = useMoneyFormat()
  const { showToast } = useToast()
  const isEn = language === 'en'

  const [tab, setTab] = useState<TabKey>('overview')
  const [period, setPeriod] = useState<FinanceCenterPeriod>('MONTH')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [compareDate, setCompareDate] = useState(() => previousPeriodDate(new Date(), 'MONTH'))
  const [exporting, setExporting] = useState(false)

  const { data, loading, refreshing, error, refresh } = useFinanceCenter(
    period,
    selectedDate,
    compareDate,
    true,
  )

  const insights = useMemo(
    () => buildInsights(data, isEn, formatMoney),
    [data, isEn, formatMoney],
  )

  const applyCurrentDate = (next: Date) => {
    const now = new Date()
    const clamped = next > now ? now : next
    setSelectedDate(clamped)
    setCompareDate(previousPeriodDate(clamped, period))
  }

  const changePeriod = (next: FinanceCenterPeriod) => {
    setPeriod(next)
    setCompareDate(previousPeriodDate(selectedDate, next))
  }

  const shiftCurrent = (dir: -1 | 1) => {
    const next = shiftPeriod(selectedDate, period, dir)
    if (dir === 1 && next > new Date()) return
    applyCurrentDate(next)
  }

  const onExport = async () => {
    try {
      setExporting(true)
      const message = buildExportText(data, isEn, formatMoney)
      const result = await Share.share({
        title: isEn ? 'SmartSpend report' : 'Báo cáo SmartSpend',
        message,
      })
      if (result.action === Share.sharedAction) {
        showToast({
          variant: 'success',
          message: isEn ? 'Report shared' : 'Đã xuất báo cáo',
        })
      }
    } catch {
      showToast({
        variant: 'error',
        message: isEn ? 'Could not export report' : 'Không xuất được báo cáo',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{isEn ? 'Financial Center' : 'Trung tâm tài chính'}</Text>
            <Text style={styles.subtitle}>
              {isEn ? 'Wallet + cash in one place' : 'Tổng hợp ví và tiền mặt'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={onExport}
            disabled={exporting || loading}
            activeOpacity={0.7}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={PASTEL_PALETTE.accentDeep} />
            ) : (
              <Ionicons name="share-outline" size={20} color={PASTEL_PALETTE.accentDeep} />
            )}
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      <View style={[styles.tabs, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}>
        {(
          [
            { key: 'overview', label: isEn ? 'Overview' : 'Tổng quan' },
            { key: 'wallet', label: isEn ? 'Wallet' : 'Ví' },
            { key: 'notebook', label: isEn ? 'Cash' : 'Sổ tay' },
          ] as const
        ).map((item) => {
          const active = tab === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, active && [styles.tabActive, { backgroundColor: theme.card }]]}
              onPress={() => setTab(item.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.textMuted },
                  active && [styles.tabTextActive, { color: theme.textPrimary }],
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {tab === 'overview' ? (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.overviewPad}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
        >
          {loading && num(data.totalAssets) === 0 && !data.current.totalExpense ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              <View style={styles.periodChips}>
                {(
                  [
                    { key: 'WEEK', label: isEn ? 'Week' : 'Tuần' },
                    { key: 'MONTH', label: isEn ? 'Month' : 'Tháng' },
                    { key: 'YEAR', label: isEn ? 'Year' : 'Năm' },
                  ] as const
                ).map((item) => {
                  const active = period === item.key
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.periodChip,
                        { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder },
                        active && styles.periodChipActive,
                      ]}
                      onPress={() => changePeriod(item.key)}
                    >
                      <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={styles.dateSelector}>
                <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftCurrent(-1)}>
                  <Ionicons name="chevron-back" size={18} color={PASTEL_PALETTE.title} />
                </TouchableOpacity>
                <View style={styles.dateTextContainer}>
                  <Text style={[styles.dateText, { color: theme.textPrimary, marginLeft: 0 }]}>
                    {periodLabel(period, selectedDate, isEn)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.dateNavBtn, !canGoNextPeriod(selectedDate, period) && { opacity: 0.4 }]}
                  onPress={() => shiftCurrent(1)}
                  disabled={!canGoNextPeriod(selectedDate, period)}
                >
                  <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.title} />
                </TouchableOpacity>
              </View>

              {error ? (
                <Text style={[styles.cardHint, { color: theme.error }]}>{error}</Text>
              ) : null}

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'Personal assets' : 'Tổng tài sản cá nhân'}
                </Text>
                <Text style={[styles.heroAmount, { color: theme.textPrimary }]}>
                  {formatMoney(num(data.totalAssets))}
                </Text>
                <View style={[styles.shareTrack, { backgroundColor: theme.bgSoft }]}>
                  <View
                    style={[
                      styles.shareFill,
                      {
                        width: `${clampShare(num(data.walletBalancePercent))}%`,
                        backgroundColor: WALLET_COLOR,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.shareFill,
                      {
                        width: `${clampShare(num(data.cashBalancePercent))}%`,
                        backgroundColor: CASH_COLOR,
                      },
                    ]}
                  />
                </View>
                <View style={styles.heroCols}>
                  <View style={[styles.heroCol, { backgroundColor: theme.bgSoft }]}>
                    <Text style={[styles.heroColLabel, { color: theme.textMuted }]}>
                      {isEn ? 'SmartSpend wallet' : 'Ví SmartSpend'}
                    </Text>
                    <Text style={[styles.heroColValue, { color: theme.textPrimary }]}>
                      {formatMoney(num(data.walletBalance))}
                    </Text>
                    <Text style={[styles.heroColPct, { color: WALLET_COLOR }]}>
                      {clampShare(num(data.walletBalancePercent)).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.heroCol, { backgroundColor: theme.bgSoft }]}>
                    <Text style={[styles.heroColLabel, { color: theme.textMuted }]}>
                      {isEn ? 'Cash notebook' : 'Sổ tay tiền mặt'}
                    </Text>
                    <Text style={[styles.heroColValue, { color: theme.textPrimary }]}>
                      {formatMoney(num(data.cashBalance))}
                    </Text>
                    <Text style={[styles.heroColPct, { color: CASH_COLOR }]}>
                      {clampShare(num(data.cashBalancePercent)).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'Period comparison' : 'So sánh kỳ'}
                </Text>
                <Text style={styles.cardHint}>
                  {periodLabel(period, selectedDate, isEn)} vs {isEn ? 'previous period' : 'kỳ trước'}
                </Text>

                <View style={styles.summaryGrid}>
                  <DeltaCell
                    label={isEn ? 'Income' : 'Thu'}
                    value={formatMoney(num(data.current.totalIncome))}
                    delta={data.delta.totalIncome}
                    positiveIsGood
                    isEn={isEn}
                    theme={theme}
                  />
                  <DeltaCell
                    label={isEn ? 'Expense' : 'Chi'}
                    value={formatMoney(num(data.current.totalExpense))}
                    delta={data.delta.totalExpense}
                    positiveIsGood={false}
                    isEn={isEn}
                    theme={theme}
                  />
                  <DeltaCell
                    label={isEn ? 'Net' : 'Ròng'}
                    value={formatMoney(num(data.current.net))}
                    delta={data.delta.net}
                    positiveIsGood
                    isEn={isEn}
                    theme={theme}
                  />
                </View>

                <CompareMetric
                  title={isEn ? 'Wallet' : 'Ví SmartSpend'}
                  currentIncome={num(data.current.wallet.income)}
                  currentExpense={num(data.current.wallet.expense)}
                  compareIncome={num(data.compare.wallet.income)}
                  compareExpense={num(data.compare.wallet.expense)}
                  formatMoney={formatMoney}
                  isEn={isEn}
                  theme={theme}
                />
                <CompareMetric
                  title={isEn ? 'Cash notebook' : 'Sổ tay tiền mặt'}
                  currentIncome={num(data.current.cash.income)}
                  currentExpense={num(data.current.cash.expense)}
                  compareIncome={num(data.compare.cash.income)}
                  compareExpense={num(data.compare.cash.expense)}
                  formatMoney={formatMoney}
                  isEn={isEn}
                  theme={theme}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'Wallet vs cash' : 'Ví và tiền mặt'}
                </Text>
                <Text style={styles.cardHint}>
                  {isEn ? 'Where money sits now, and how it moved this period.' : 'Số dư hiện tại và dòng tiền trong kỳ.'}
                </Text>

                <View style={styles.vsRow}>
                  <View style={[styles.vsCol, { backgroundColor: PASTEL_PALETTE.accentSoft }]}>
                    <Text style={[styles.vsLabel, { color: WALLET_COLOR }]}>
                      {isEn ? 'Wallet' : 'Ví'}
                    </Text>
                    <Text style={[styles.vsValue, { color: theme.textPrimary }]}>
                      {formatMoney(num(data.walletBalance))}
                    </Text>
                    <Text style={[styles.vsPct, { color: WALLET_COLOR }]}>
                      {clampShare(num(data.walletBalancePercent)).toFixed(0)}%
                    </Text>
                  </View>
                  <Text style={styles.vsMid}>vs</Text>
                  <View style={[styles.vsCol, { backgroundColor: PASTEL_PALETTE.lavenderSoft }]}>
                    <Text style={[styles.vsLabel, { color: CASH_COLOR }]}>
                      {isEn ? 'Cash' : 'Tiền mặt'}
                    </Text>
                    <Text style={[styles.vsValue, { color: theme.textPrimary }]}>
                      {formatMoney(num(data.cashBalance))}
                    </Text>
                    <Text style={[styles.vsPct, { color: CASH_COLOR }]}>
                      {clampShare(num(data.cashBalancePercent)).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.flowLine}>
                  <Text style={[styles.flowLabel, { color: theme.textMuted }]}>
                    {isEn ? 'Wallet in / out' : 'Ví thu / chi'}
                  </Text>
                  <Text style={[styles.flowValue, { color: theme.textPrimary }]}>
                    {formatMoney(num(data.current.wallet.income))} / {formatMoney(num(data.current.wallet.expense))}
                  </Text>
                </View>
                <View style={styles.flowLine}>
                  <Text style={[styles.flowLabel, { color: theme.textMuted }]}>
                    {isEn ? 'Cash in / out' : 'Tiền mặt thu / chi'}
                  </Text>
                  <Text style={[styles.flowValue, { color: theme.textPrimary }]}>
                    {formatMoney(num(data.current.cash.income))} / {formatMoney(num(data.current.cash.expense))}
                  </Text>
                </View>
                <View style={styles.flowLine}>
                  <Text style={[styles.flowLabel, { color: theme.textMuted }]}>
                    {isEn ? 'Activity share' : 'Tỷ lệ hoạt động kỳ'}
                  </Text>
                  <Text style={[styles.flowValue, { color: theme.textPrimary }]}>
                    {activityShareLabel(data, isEn)}
                  </Text>
                </View>
              </View>

              {insights.length ? (
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    {isEn ? 'Highlights' : 'Nhận xét nhanh'}
                  </Text>
                  {insights.map((line) => (
                    <Text key={line} style={[styles.insight, { color: theme.textSecondary }]}>
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      ) : null}

      {tab === 'wallet' ? (
        <View style={styles.nestedPad}>
          <WalletReport active />
        </View>
      ) : null}

      {tab === 'notebook' ? (
        <View style={styles.nestedPad}>
          <NotebookReport active />
        </View>
      ) : null}
    </View>
  )
}

function activityShareLabel(
  data: {
    current: { wallet: { income: number; expense: number }; cash: { income: number; expense: number } }
  },
  isEn: boolean,
) {
  const wallet = flowVolume(data.current.wallet)
  const cash = flowVolume(data.current.cash)
  const total = wallet + cash
  if (total <= 0) return isEn ? 'No activity' : 'Chưa có phát sinh'
  const walletPct = Math.round((wallet / total) * 100)
  return isEn ? `${walletPct}% wallet / ${100 - walletPct}% cash` : `${walletPct}% ví / ${100 - walletPct}% tiền mặt`
}

function DeltaCell({
  label,
  value,
  delta,
  positiveIsGood,
  isEn,
  theme,
}: {
  label: string
  value: string
  delta: FinanceAmountDelta
  positiveIsGood: boolean
  isEn: boolean
  theme: { success: string; error: string; textMuted: string; textPrimary: string; bgSoft: string }
}) {
  const amount = num(delta?.amount)
  const color =
    amount === 0 ? theme.textMuted : (amount > 0) === positiveIsGood ? theme.success : theme.error
  return (
    <View style={[styles.summaryCell, { backgroundColor: theme.bgSoft }]}>
      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.summaryDelta, { color }]}>
        {amount === 0 ? '0%' : formatDeltaPercent(delta?.percent, isEn)}
      </Text>
    </View>
  )
}

function CompareMetric({
  title,
  currentIncome,
  currentExpense,
  compareIncome,
  compareExpense,
  formatMoney,
  isEn,
  theme,
}: {
  title: string
  currentIncome: number
  currentExpense: number
  compareIncome: number
  compareExpense: number
  formatMoney: (value: number) => string
  isEn: boolean
  theme: { textPrimary: string; textMuted: string }
}) {
  const max = Math.max(currentIncome, currentExpense, compareIncome, compareExpense, 1)
  return (
    <View style={styles.metricBlock}>
      <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>{title}</Text>
      <BarLine
        label={isEn ? 'Income this period' : 'Thu kỳ này'}
        value={currentIncome}
        max={max}
        color={CURRENT_BAR}
        formatMoney={formatMoney}
        theme={theme}
      />
      <BarLine
        label={isEn ? 'Income compared' : 'Thu kỳ so sánh'}
        value={compareIncome}
        max={max}
        color={COMPARE_BAR}
        formatMoney={formatMoney}
        theme={theme}
      />
      <BarLine
        label={isEn ? 'Expense this period' : 'Chi kỳ này'}
        value={currentExpense}
        max={max}
        color={CURRENT_BAR}
        formatMoney={formatMoney}
        theme={theme}
      />
      <BarLine
        label={isEn ? 'Expense compared' : 'Chi kỳ so sánh'}
        value={compareExpense}
        max={max}
        color={COMPARE_BAR}
        formatMoney={formatMoney}
        theme={theme}
      />
    </View>
  )
}

function BarLine({
  label,
  value,
  max,
  color,
  formatMoney,
  theme,
}: {
  label: string
  value: number
  max: number
  color: string
  formatMoney: (value: number) => string
  theme: { textMuted: string; textPrimary: string }
}) {
  const width = `${Math.max(4, Math.round((Math.abs(value) / max) * 100))}%`
  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={[styles.barLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.barValue, { color: theme.textPrimary }]}>{formatMoney(value)}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: width as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}
