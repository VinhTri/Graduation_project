import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BarChart, PieChart } from 'react-native-gifted-charts'
import Svg, { Path } from 'react-native-svg'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext'
import { useMoneyFormat } from '@/shared/contexts/MoneyFormatContext'
import { useToast } from '@/shared/components/Toast'
import type { FinanceCenterPeriod } from '@/shared/api/services/reportService'
import { reportService, type ReportDistributionResponse } from '@/shared/api/services/reportService'
import { useFinanceCenter } from '../hooks/useFinanceCenter'
import {
  buildExportText,
  canGoNextPeriod,
  clampShare,
  num,
  periodLabel,
  previousPeriodDate,
  shiftPeriod,
  toIsoDate,
} from '../utils'
import { styles } from './finance-center.styles'

type TabKey = 'overview' | 'compare'

const WALLET_COLOR = PASTEL_PALETTE.accentDeep
const CASH_COLOR = PASTEL_PALETTE.lavender

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
  const [analyzing, setAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [rankCurrent, setRankCurrent] = useState<ReportDistributionResponse[]>([])
  const [rankCompare, setRankCompare] = useState<ReportDistributionResponse[]>([])
  const [exporting, setExporting] = useState(false)
  const assetPulse = useRef(new Animated.Value(0)).current
  const assetWave = useRef(new Animated.Value(0)).current

  const { data, loading, refreshing, error, refresh } = useFinanceCenter(
    period,
    selectedDate,
    compareDate,
    true,
  )

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(assetPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(assetPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(assetWave, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(assetWave, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    pulseLoop.start()
    waveLoop.start()
    return () => {
      pulseLoop.stop()
      waveLoop.stop()
    }
  }, [assetPulse, assetWave])

  const applyCurrentDate = (next: Date) => {
    const now = new Date()
    const clamped = next > now ? now : next
    setSelectedDate(clamped)
    setCompareDate(previousPeriodDate(clamped, period))
    setHasAnalyzed(false)
  }

  const changePeriod = (next: FinanceCenterPeriod) => {
    setPeriod(next)
    const now = new Date()
    setSelectedDate(now)
    setCompareDate(previousPeriodDate(now, next))
    setHasAnalyzed(false)
  }

  const applyComparePreset = () => {
    const now = new Date()
    setSelectedDate(now)
    setCompareDate(previousPeriodDate(now, period))
    setHasAnalyzed(false)
  }

  const shiftCurrent = (dir: -1 | 1) => {
    const next = shiftPeriod(selectedDate, period, dir)
    if (dir === 1 && next > new Date()) return
    applyCurrentDate(next)
  }

  const shiftCompare = (dir: -1 | 1) => {
    const next = shiftPeriod(compareDate, period, dir)
    if (next >= selectedDate) return
    setCompareDate(next)
    setHasAnalyzed(false)
  }

  const runAnalysis = async () => {
    try {
      setAnalyzing(true)
      setHasAnalyzed(true)
      const filter = period.toLowerCase()
      const [currentDist, compareDist] = await Promise.all([
        reportService.getDistributionReport('EXPENSE', filter, toIsoDate(selectedDate)),
        reportService.getDistributionReport('EXPENSE', filter, toIsoDate(compareDate)),
      ])
      setRankCurrent(currentDist.slice().sort((a, b) => num(b.totalAmount) - num(a.totalAmount)).slice(0, 6))
      setRankCompare(compareDist.slice().sort((a, b) => num(b.totalAmount) - num(a.totalAmount)).slice(0, 6))
    } catch {
      setRankCurrent([])
      setRankCompare([])
      showToast({
        variant: 'error',
        message: isEn ? 'Could not analyze categories' : 'Không phân tích được danh mục',
      })
    } finally {
      setAnalyzing(false)
    }
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

  const walletTopup = num(data.current.wallet.income)
  const walletWithdraw = num(data.current.wallet.expense)
  const fundDeposit = num(data.current.fund?.income)
  const fundWithdraw = num(data.current.fund?.expense)
  const notebookIncome = num(data.current.cash.income)
  const notebookExpense = num(data.current.cash.expense)
  const walletShare = clampShare(num(data.walletBalancePercent))
  const cashShare = clampShare(num(data.cashBalancePercent))

  const assetPieData = [
    { value: Math.max(walletShare, 0.0001), color: WALLET_COLOR },
    { value: Math.max(cashShare, 0.0001), color: CASH_COLOR },
  ]

  const assetPulseOpacity = assetPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  })
  const assetWaveShift = assetWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  })
  const assetGlowScale = assetPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  })

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
            { key: 'compare', label: isEn ? 'Compare' : 'So sánh' },
            { key: 'export', label: isEn ? 'Export report' : 'Xuất báo cáo' },
          ] as const
        ).map((item) => {
          const active = tab === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, active && [styles.tabActive, { backgroundColor: theme.card }]]}
              onPress={() => {
                if (item.key === 'export') {
                  onExport()
                  return
                }
                setTab(item.key)
              }}
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

              <TotalAssetsHero
                isEn={isEn}
                theme={theme}
                formatMoney={formatMoney}
                totalAssets={num(data.totalAssets)}
                walletBalance={num(data.walletBalance)}
                cashBalance={num(data.cashBalance)}
                walletShare={walletShare}
                cashShare={cashShare}
                assetPieData={assetPieData}
                assetPulseOpacity={assetPulseOpacity}
                assetWaveShift={assetWaveShift}
                assetGlowScale={assetGlowScale}
              />

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'SmartSpend wallet totals' : 'Tổng nạp/rút của ví'}
                </Text>
                <Text style={styles.cardHint}>{periodLabel(period, selectedDate, isEn)}</Text>
                <ModernColumnChart
                  theme={theme}
                  formatMoney={formatMoney}
                  rows={[
                    {
                      label: isEn ? 'Top-up' : 'Nạp',
                      value: walletTopup,
                      color: '#22C55E',
                      bgSoft: '#E8F8EE',
                    },
                    {
                      label: isEn ? 'Withdraw' : 'Rút',
                      value: walletWithdraw,
                      color: '#F97316',
                      bgSoft: '#FFF0E8',
                    },
                  ]}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'Fund totals' : 'Tổng nạp/rút quỹ'}
                </Text>
                <Text style={styles.cardHint}>{periodLabel(period, selectedDate, isEn)}</Text>
                <ModernColumnChart
                  theme={theme}
                  formatMoney={formatMoney}
                  rows={[
                    {
                      label: isEn ? 'Deposit' : 'Nạp',
                      value: fundDeposit,
                      color: '#3B82F6',
                      bgSoft: '#EAF2FF',
                    },
                    {
                      label: isEn ? 'Withdraw' : 'Rút',
                      value: fundWithdraw,
                      color: '#A855F7',
                      bgSoft: '#F4EBFF',
                    },
                  ]}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  {isEn ? 'Cash notebook totals' : 'Tổng thu/chi sổ tay'}
                </Text>
                <Text style={styles.cardHint}>{periodLabel(period, selectedDate, isEn)}</Text>
                <ModernColumnChart
                  theme={theme}
                  formatMoney={formatMoney}
                  rows={[
                    {
                      label: isEn ? 'Income' : 'Thu',
                      value: notebookIncome,
                      color: '#14B8A6',
                      bgSoft: '#E7F8F5',
                    },
                    {
                      label: isEn ? 'Expense' : 'Chi',
                      value: notebookExpense,
                      color: '#EF4444',
                      bgSoft: '#FEECEC',
                    },
                  ]}
                />
              </View>

            </>
          )}
        </ScrollView>
      ) : null}

      {tab === 'compare' ? (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.comparePad}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
        >
          <ComparePeriodPicker
            isEn={isEn}
            theme={theme}
            period={period}
            selectedDate={selectedDate}
            compareDate={compareDate}
            analyzing={analyzing}
            onChangePeriod={changePeriod}
            onApplyPreset={applyComparePreset}
            onShiftCurrent={shiftCurrent}
            onShiftCompare={shiftCompare}
            onAnalyze={runAnalysis}
          />

          {hasAnalyzed ? (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {isEn ? 'Analysis result' : 'Kết quả phân tích'}
              </Text>

              <CompareAnalysisTotal
                aLabel={periodLabel(period, selectedDate, isEn)}
                bLabel={periodLabel(period, compareDate, isEn)}
                aValue={num(data.current.totalExpense)}
                bValue={num(data.compare.totalExpense)}
                formatMoney={formatMoney}
                isEn={isEn}
                theme={theme}
              />

              <Text style={[styles.analysisSectionTitle, { color: theme.textMuted }]}>
                {isEn ? 'By source' : 'Theo từng nguồn'}
              </Text>

              <CompareAnalysisLine
                label={isEn ? 'SmartSpend wallet' : 'Ví SmartSpend'}
                aLabel={periodLabel(period, selectedDate, isEn)}
                bLabel={periodLabel(period, compareDate, isEn)}
                aValue={num(data.current.wallet.expense)}
                bValue={num(data.compare.wallet.expense)}
                formatMoney={formatMoney}
                isEn={isEn}
              />
              <CompareAnalysisLine
                label={isEn ? 'Cash notebook' : 'Sổ tay tiền mặt'}
                aLabel={periodLabel(period, selectedDate, isEn)}
                bLabel={periodLabel(period, compareDate, isEn)}
                aValue={num(data.current.cash.expense)}
                bValue={num(data.compare.cash.expense)}
                formatMoney={formatMoney}
                isEn={isEn}
              />
            </View>
          ) : null}

          {hasAnalyzed ? (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {isEn ? 'Category ranking (high to low)' : 'Xếp hạng danh mục (cao xuống thấp)'}
              </Text>
              <View style={styles.rankColumns}>
                <View style={styles.rankCol}>
                  <Text style={[styles.rankTitle, { color: theme.textPrimary }]}>
                    {periodLabel(period, selectedDate, isEn)}
                  </Text>
                  {rankCurrent.length ? (
                    rankCurrent.map((item, idx) => (
                      <RankRow
                        key={`${item.categoryId ?? idx}-a`}
                        index={idx + 1}
                        item={item}
                        formatMoney={formatMoney}
                        theme={theme}
                      />
                    ))
                  ) : (
                    <Text style={[styles.rankEmpty, { color: theme.textMuted }]}>
                      {isEn ? 'No data' : 'Không có dữ liệu'}
                    </Text>
                  )}
                </View>
                <View style={styles.rankCol}>
                  <Text style={[styles.rankTitle, { color: theme.textPrimary }]}>
                    {periodLabel(period, compareDate, isEn)}
                  </Text>
                  {rankCompare.length ? (
                    rankCompare.map((item, idx) => (
                      <RankRow
                        key={`${item.categoryId ?? idx}-b`}
                        index={idx + 1}
                        item={item}
                        formatMoney={formatMoney}
                        theme={theme}
                      />
                    ))
                  ) : (
                    <Text style={[styles.rankEmpty, { color: theme.textMuted }]}>
                      {isEn ? 'No data' : 'Không có dữ liệu'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  )
}

function ComparePeriodPicker({
  isEn,
  theme,
  period,
  selectedDate,
  compareDate,
  analyzing,
  onChangePeriod,
  onApplyPreset,
  onShiftCurrent,
  onShiftCompare,
  onAnalyze,
}: {
  isEn: boolean
  theme: { card: string; cardBorder: string; textPrimary: string; textMuted: string; bgSoft: string }
  period: FinanceCenterPeriod
  selectedDate: Date
  compareDate: Date
  analyzing: boolean
  onChangePeriod: (next: FinanceCenterPeriod) => void
  onApplyPreset: () => void
  onShiftCurrent: (dir: -1 | 1) => void
  onShiftCompare: (dir: -1 | 1) => void
  onAnalyze: () => void
}) {
  const periodItems = [
    { key: 'WEEK' as const, label: isEn ? 'Week' : 'Tuần' },
    { key: 'MONTH' as const, label: isEn ? 'Month' : 'Tháng' },
    { key: 'YEAR' as const, label: isEn ? 'Year' : 'Năm' },
  ]

  const presetLabel =
    period === 'WEEK'
      ? isEn
        ? 'This week vs last week'
        : 'Tuần này vs tuần trước'
      : period === 'MONTH'
        ? isEn
          ? 'This month vs last month'
          : 'Tháng này vs tháng trước'
        : isEn
          ? 'This year vs last year'
          : 'Năm nay vs năm trước'

  const canNextCurrent = canGoNextPeriod(selectedDate, period)
  const canNextCompare = shiftPeriod(compareDate, period, 1) < selectedDate

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
        {isEn ? 'Compare periods' : 'So sánh kỳ'}
      </Text>

      <View style={[styles.compareSegment, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}>
        {periodItems.map((item) => {
          const active = period === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.compareSegmentItem, active && styles.compareSegmentItemActive]}
              onPress={() => onChangePeriod(item.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.compareSegmentText, active && styles.compareSegmentTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity
        style={[styles.comparePresetBtn, { borderColor: theme.cardBorder, backgroundColor: theme.bgSoft }]}
        onPress={onApplyPreset}
        activeOpacity={0.85}
      >
        <Ionicons name="flash-outline" size={14} color={PASTEL_PALETTE.accentDeep} />
        <Text style={styles.comparePresetText}>{presetLabel}</Text>
      </TouchableOpacity>

      <View style={[styles.comparePeriodBox, { borderColor: theme.cardBorder, backgroundColor: theme.bgSoft }]}>
        <View style={styles.comparePeriodHalf}>
          <View style={styles.comparePeriodBadge}>
            <Text style={styles.comparePeriodBadgeText}>{isEn ? 'A' : 'Kỳ A'}</Text>
          </View>
          <Text style={[styles.comparePeriodLabel, { color: theme.textPrimary }]} numberOfLines={2}>
            {periodLabel(period, selectedDate, isEn)}
          </Text>
          <View style={styles.comparePeriodNav}>
            <TouchableOpacity style={styles.compareNavBtn} onPress={() => onShiftCurrent(-1)}>
              <Ionicons name="chevron-back" size={16} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compareNavBtn, !canNextCurrent && styles.compareNavBtnDisabled]}
              onPress={() => onShiftCurrent(1)}
              disabled={!canNextCurrent}
            >
              <Ionicons name="chevron-forward" size={16} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.comparePeriodVsWrap}>
          <Text style={[styles.comparePeriodVs, { color: theme.textMuted }]}>vs</Text>
        </View>

        <View style={styles.comparePeriodHalf}>
          <View style={[styles.comparePeriodBadge, styles.comparePeriodBadgeB]}>
            <Text style={[styles.comparePeriodBadgeText, styles.comparePeriodBadgeTextB]}>
              {isEn ? 'B' : 'Kỳ B'}
            </Text>
          </View>
          <Text style={[styles.comparePeriodLabel, { color: theme.textPrimary }]} numberOfLines={2}>
            {periodLabel(period, compareDate, isEn)}
          </Text>
          <View style={styles.comparePeriodNav}>
            <TouchableOpacity style={styles.compareNavBtn} onPress={() => onShiftCompare(-1)}>
              <Ionicons name="chevron-back" size={16} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compareNavBtn, !canNextCompare && styles.compareNavBtnDisabled]}
              onPress={() => onShiftCompare(1)}
              disabled={!canNextCompare}
            >
              <Ionicons name="chevron-forward" size={16} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: PASTEL_PALETTE.accentDeep }]}
        onPress={onAnalyze}
        activeOpacity={0.85}
        disabled={analyzing}
      >
        {analyzing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="analytics-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.analyzeBtnText}>{isEn ? 'Analyze' : 'Phân tích'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

function buildCompareMessage(
  aLabel: string,
  bLabel: string,
  aValue: number,
  bValue: number,
  formatMoney: (value: number) => string,
  isEn: boolean,
) {
  const diff = aValue - bValue
  const higher = diff === 0 ? null : diff > 0 ? aLabel : bLabel
  const base = higher === aLabel ? bValue : aValue
  const pct = base > 0 ? (Math.abs(diff) / base) * 100 : 0
  if (!higher) {
    return isEn ? 'Two periods are equal.' : 'Hai kỳ bằng nhau.'
  }
  return isEn
    ? `${higher} is higher by ${pct.toFixed(1)}% (${formatMoney(Math.abs(diff))}).`
    : `${higher} cao hơn ${pct.toFixed(1)}% (${formatMoney(Math.abs(diff))}).`
}

function CompareAnalysisTotal({
  aLabel,
  bLabel,
  aValue,
  bValue,
  formatMoney,
  isEn,
  theme,
}: {
  aLabel: string
  bLabel: string
  aValue: number
  bValue: number
  formatMoney: (value: number) => string
  isEn: boolean
  theme: { textPrimary: string; textMuted: string; bgSoft: string; cardBorder: string }
}) {
  return (
    <View
      style={[
        styles.analysisTotalRow,
        { backgroundColor: theme.bgSoft, borderColor: PASTEL_PALETTE.accentDeep },
      ]}
    >
      <Text style={styles.analysisTotalLabel}>
        {isEn ? 'Total spending (wallet + cash)' : 'Tổng chi tiêu (Ví + Sổ tay)'}
      </Text>
      <View style={styles.analysisTotalAmounts}>
        <View style={[styles.analysisAmountCell, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.analysisAmountPeriod, { color: theme.textMuted }]} numberOfLines={1}>
            {aLabel}
          </Text>
          <Text style={[styles.analysisAmountValue, { color: theme.textPrimary }]}>
            {formatMoney(aValue)}
          </Text>
        </View>
        <Text style={[styles.analysisAmountVs, { color: theme.textMuted }]}>vs</Text>
        <View style={[styles.analysisAmountCell, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.analysisAmountPeriod, { color: theme.textMuted }]} numberOfLines={1}>
            {bLabel}
          </Text>
          <Text style={[styles.analysisAmountValue, { color: theme.textPrimary }]}>
            {formatMoney(bValue)}
          </Text>
        </View>
      </View>
      <Text style={styles.analysisTotalSummary}>
        {buildCompareMessage(aLabel, bLabel, aValue, bValue, formatMoney, isEn)}
      </Text>
    </View>
  )
}

function CompareAnalysisLine({
  label,
  aLabel,
  bLabel,
  aValue,
  bValue,
  formatMoney,
  isEn,
}: {
  label: string
  aLabel: string
  bLabel: string
  aValue: number
  bValue: number
  formatMoney: (value: number) => string
  isEn: boolean
}) {
  return (
    <View style={styles.analysisRow}>
      <Text style={styles.analysisLabel}>{label}</Text>
      <Text style={styles.analysisText}>
        {buildCompareMessage(aLabel, bLabel, aValue, bValue, formatMoney, isEn)}
      </Text>
    </View>
  )
}

function RankRow({
  index,
  item,
  formatMoney,
  theme,
}: {
  index: number
  item: ReportDistributionResponse
  formatMoney: (value: number) => string
  theme: { textPrimary: string; textMuted: string }
}) {
  return (
    <View style={styles.rankRow}>
      <Text style={[styles.rankIdx, { color: theme.textMuted }]}>{index}.</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rankName, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.categoryName}
        </Text>
        <Text style={[styles.rankAmount, { color: theme.textMuted }]}>
          {formatMoney(num(item.totalAmount))}
        </Text>
      </View>
    </View>
  )
}


type FlowChartRow = {
  label: string
  value: number
  color: string
  bgSoft: string
}

function ModernColumnChart({
  rows,
  formatMoney,
  theme,
}: {
  rows: FlowChartRow[]
  formatMoney: (value: number) => string
  theme: { textPrimary: string; bgSoft: string }
}) {
  const barWidth = 46
  const spacing = 34
  const chartHeight = 148
  const max = Math.max(...rows.map((row) => num(row.value)), 1)
  const chartWidth = 24 + rows.length * barWidth + Math.max(rows.length - 1, 0) * spacing + 24

  const barData = rows.map((row) => ({
    value: num(row.value),
    label: row.label,
    frontColor: row.color,
    topLabelComponent: () => null,
  }))

  return (
    <View style={[styles.columnChartWrap, { backgroundColor: theme.bgSoft }]}>
      <View style={styles.columnChartBars}>
        <BarChart
          data={barData as any}
          width={chartWidth}
          height={chartHeight}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={24}
          endSpacing={24}
          roundedTop
          roundedBottom
          maxValue={max * 1.12}
          noOfSections={3}
          hideRules={false}
          rulesColor="#E9D5FF"
          rulesType="solid"
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor="#E9D5FF"
          yAxisTextStyle={styles.columnChartYAxis}
          xAxisLabelTextStyle={styles.columnChartXLabel}
        />
      </View>

      <View style={styles.columnChartSide}>
        {rows.map((row) => (
          <View
            key={row.label}
            style={[styles.columnChartSideRow, { backgroundColor: row.bgSoft, borderColor: `${row.color}33` }]}
          >
            <View style={styles.columnChartSideTop}>
              <View style={[styles.columnChartDot, { backgroundColor: row.color }]} />
              <Text style={[styles.columnChartSideLabel, { color: row.color }]}>{row.label}</Text>
            </View>
            <Text style={[styles.columnChartSideAmount, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatMoney(num(row.value))}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}


function TotalAssetsHero({
  isEn,
  theme,
  formatMoney,
  totalAssets,
  walletBalance,
  cashBalance,
  walletShare,
  cashShare,
  assetPieData,
  assetPulseOpacity,
  assetWaveShift,
  assetGlowScale,
}: {
  isEn: boolean
  theme: {
    card: string
    cardBorder: string
    textPrimary: string
    textMuted: string
    bgSoft: string
  }
  formatMoney: (value: number) => string
  totalAssets: number
  walletBalance: number
  cashBalance: number
  walletShare: number
  cashShare: number
  assetPieData: { value: number; color: string }[]
  assetPulseOpacity: Animated.AnimatedInterpolation<number>
  assetWaveShift: Animated.AnimatedInterpolation<number>
  assetGlowScale: Animated.AnimatedInterpolation<number>
}) {
  return (
    <View style={styles.assetHeroOuter}>
      <LinearGradient
        colors={[PASTEL_PALETTE.white, PASTEL_PALETTE.lavenderSoft, PASTEL_PALETTE.bgSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.assetHeroGradient}
      >
        <View style={styles.assetHeroBlobA} />
        <View style={styles.assetHeroBlobB} />

        <View style={styles.assetHeroHeader}>
          <View style={styles.assetTitleRow}>
            <LinearGradient
              colors={[PASTEL_PALETTE.accentDeep, PASTEL_PALETTE.lavender]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assetTitleIcon}
            >
              <Ionicons name="sparkles-outline" size={16} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.assetHeroTitle, { color: theme.textPrimary }]}>
              {isEn ? 'Current assets' : 'Tổng tài sản hiện tại'}
            </Text>
          </View>
          <View style={styles.assetNotePill}>
            <Ionicons name="information-circle" size={14} color={PASTEL_PALETTE.subtitle} />
            <Text style={styles.assetNoteText}>
              {isEn ? 'Excludes fund balances' : 'Lưu ý: không tính số dư quỹ'}
            </Text>
          </View>
        </View>

        <Text style={styles.assetHeroAmount}>{formatMoney(totalAssets)}</Text>

        <View style={styles.assetVisualRow}>
          <View style={styles.assetDonutShell}>
            <Animated.View
              style={[
                styles.assetDonutGlow,
                {
                  transform: [{ scale: assetGlowScale }],
                  opacity: assetPulseOpacity,
                },
              ]}
            />
            <View style={styles.assetDonutCanvas}>
              <PieChart
                data={assetPieData as any}
                donut
                radius={78}
                innerRadius={52}
                innerCircleColor="rgba(255,255,255,0.92)"
                strokeWidth={3}
                strokeColor="#FFF"
                centerLabelComponent={() => (
                  <View style={styles.assetCenterWrap}>
                    <Text style={styles.assetCenterPct}>
                      {walletShare.toFixed(0)}%
                    </Text>
                    <Text style={styles.assetCenterPctDivider}>/</Text>
                    <Text style={[styles.assetCenterPct, { color: CASH_COLOR }]}>
                      {cashShare.toFixed(0)}%
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>

          <Animated.View style={[styles.waveDividerWrap, { transform: [{ translateY: assetWaveShift }] }]}>
            <Svg width={28} height={128} viewBox="0 0 28 128">
              <Path
                d="M14 2 C 3 16, 25 28, 14 42 C 3 56, 25 68, 14 82 C 3 96, 25 108, 14 122"
                stroke={PASTEL_PALETTE.lavender}
                strokeWidth={2.6}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M14 8 C 8 18, 20 28, 14 38 C 8 48, 20 58, 14 68 C 8 78, 20 88, 14 98"
                stroke={PASTEL_PALETTE.accentSoft}
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
                opacity={0.85}
              />
            </Svg>
          </Animated.View>

          <View style={styles.assetLegendStack}>
            <View style={[styles.assetLegendCard, { borderColor: `${WALLET_COLOR}33` }]}>
              <View style={styles.assetLegendHead}>
                <SmartSpendIcon size={22} borderRadius={6} />
                <Text style={[styles.assetLegendName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {isEn ? 'SmartSpend wallet' : 'Ví SmartSpend'}
                </Text>
              </View>
              <Text style={[styles.assetLegendPct, { color: WALLET_COLOR }]}>
                {walletShare.toFixed(0)}%
              </Text>
              <Text style={[styles.assetLegendAmount, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatMoney(walletBalance)}
              </Text>
            </View>

            <View style={[styles.assetLegendCard, { borderColor: `${CASH_COLOR}33` }]}>
              <View style={styles.assetLegendHead}>
                <View style={[styles.assetNotebookIcon, { backgroundColor: PASTEL_PALETTE.lavenderSoft }]}>
                  <Ionicons name="book-outline" size={14} color={PASTEL_PALETTE.accentDeep} />
                </View>
                <Text style={[styles.assetLegendName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {isEn ? 'Cash notebook' : 'Sổ tay tiền mặt'}
                </Text>
              </View>
              <Text style={[styles.assetLegendPct, { color: CASH_COLOR }]}>
                {cashShare.toFixed(0)}%
              </Text>
              <Text style={[styles.assetLegendAmount, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatMoney(cashBalance)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}
