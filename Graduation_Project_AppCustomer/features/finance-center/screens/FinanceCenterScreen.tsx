import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { NotebookReport } from '@/features/notebook/report'
import { WalletReport } from '@/features/wallet/report'
import { useTheme } from '@/shared/contexts/ThemeLanguageContext'
import { useMoneyFormat } from '@/shared/contexts/MoneyFormatContext'
import type { FinanceCenterPeriod } from '@/shared/api/services/reportService'
import { useFinanceCenter } from '../hooks/useFinanceCenter'
import {
  canGoNextPeriod,
  formatDeltaPercent,
  num,
  periodLabel,
  previousPeriodDate,
  shiftPeriod,
} from '../utils'
import { exportFinanceReportPdf } from '../exportFinanceReportPdf'
import { styles } from './finance-center.styles'

type TabKey = 'overview' | 'spending' | 'budget' | 'cashflow' | 'fund'

const TAB_ITEMS: {
  key: TabKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  { key: 'overview', label: 'Tổng quan', icon: 'grid-outline' },
  { key: 'spending', label: 'Sổ tay', icon: 'book-outline' },
  { key: 'budget', label: 'Ngân sách', icon: 'speedometer-outline' },
  { key: 'cashflow', label: 'Ví', icon: 'wallet-outline' },
  { key: 'fund', label: 'Quỹ', icon: 'people-outline' },
]

export default function FinanceCenterScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tab?: string }>()
  const { theme } = useTheme()
  const { formatMoney } = useMoneyFormat()
  const initialTab = TAB_ITEMS.some((item) => item.key === params.tab)
    ? params.tab as TabKey
    : 'overview'
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [period, setPeriod] = useState<FinanceCenterPeriod>('MONTH')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const compareDate = useMemo(
    () => previousPeriodDate(selectedDate, period),
    [period, selectedDate],
  )
  const [exporting, setExporting] = useState(false)

  const { data, loading, refreshing, error, refresh } = useFinanceCenter(
    period,
    selectedDate,
    compareDate,
    tab === 'overview' || tab === 'budget' || tab === 'cashflow' || tab === 'fund',
  )

  const changePeriod = (next: FinanceCenterPeriod) => {
    setPeriod(next)
    setSelectedDate(new Date())
  }

  const shiftCurrent = (dir: -1 | 1) => {
    const next = shiftPeriod(selectedDate, period, dir)
    if (dir === 1 && next > new Date()) return
    setSelectedDate(next)
  }

  const onExport = async () => {
    try {
      setExporting(true)
      await exportFinanceReportPdf(data, formatMoney)
    } catch (error: any) {
      Alert.alert('Không thể xuất báo cáo', error?.message || 'Vui lòng thử lại sau')
    } finally {
      setExporting(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={21} color="#6D4AAF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>SMARTSPEND INSIGHT</Text>
            <Text style={styles.headerTitle}>Trung tâm tài chính</Text>
            <Text style={styles.headerSubtitle}>Hiểu tiền của bạn, không trộn lẫn các dòng tiền.</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onExport}
            disabled={exporting || loading || !!error}
            accessibilityRole="button"
            accessibilityLabel="Xuất báo cáo PDF"
          >
            {exporting
              ? <ActivityIndicator size="small" color="#6D4AAF" />
              : <Ionicons name="document-text-outline" size={20} color="#6D4AAF" />}
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroller}
        contentContainerStyle={styles.tabs}
      >
        {TAB_ITEMS.map((item) => {
          const active = tab === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tab,
                { backgroundColor: active ? theme.card : theme.bgSoft, borderColor: theme.cardBorder },
                active && styles.tabActive,
              ]}
              onPress={() => setTab(item.key)}
              activeOpacity={0.78}
            >
              <Ionicons name={item.icon} size={15} color={active ? '#6D4AAF' : theme.textMuted} />
              <Text style={[styles.tabText, { color: active ? '#6D4AAF' : theme.textMuted }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {tab === 'spending' ? (
        <View style={styles.reportBody}>
          <View style={[styles.contextBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="book-outline" size={17} color="#6D4AAF" />
            <Text style={[styles.contextText, { color: theme.textSecondary }]}>
              Thu và chi thực tế được lấy từ Sổ tay tiền mặt.
            </Text>
          </View>
          <View style={styles.reportInset}>
            <NotebookReport active />
          </View>
        </View>
      ) : null}

      {tab === 'cashflow' ? (
        <View style={styles.reportBody}>
          <View style={[styles.contextBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="wallet-outline" size={17} color="#6D4AAF" />
            <Text style={[styles.contextText, { color: theme.textSecondary }]}>
              Nạp và rút được lấy từ lịch sử Ví SmartSpend, không bao gồm giao dịch Quỹ.
            </Text>
          </View>
          <View style={styles.reportInset}>
            <WalletReport active />
          </View>
        </View>
      ) : null}

      {tab === 'overview' || tab === 'budget' || tab === 'fund' ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />
          }
        >
          {tab === 'overview' || tab === 'budget' || tab === 'fund' ? (
            <PeriodPicker
              period={period}
              selectedDate={selectedDate}
              onChangePeriod={changePeriod}
              onShift={shiftCurrent}
            />
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : error ? (
            <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
              <Ionicons name="cloud-offline-outline" size={28} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            </View>
          ) : tab === 'overview' ? (
            <OverviewSection
              data={data}
              formatMoney={formatMoney}
              theme={theme}
              compareLabel={periodLabel(period, compareDate, false)}
              onOpenBudget={() => setTab('budget')}
              onOpenCashflow={() => setTab('cashflow')}
              onOpenFund={() => setTab('fund')}
            />
          ) : tab === 'budget' ? (
            <BudgetSection
              data={data}
              formatMoney={formatMoney}
              theme={theme}
              onOpenBudgets={() => router.push('/budget')}
            />
          ) : (
            <FundSection
              data={data}
              formatMoney={formatMoney}
              theme={theme}
              onOpenFunds={() => router.push('/(tabs)/funds')}
            />
          )}
        </ScrollView>
      ) : null}
    </View>
  )
}

function PeriodPicker({
  period,
  selectedDate,
  onChangePeriod,
  onShift,
}: {
  period: FinanceCenterPeriod
  selectedDate: Date
  onChangePeriod: (period: FinanceCenterPeriod) => void
  onShift: (dir: -1 | 1) => void
}) {
  return (
    <View style={styles.periodWrap}>
      <View style={styles.periodSegments}>
        {([
          ['WEEK', 'Tuần'],
          ['MONTH', 'Tháng'],
          ['YEAR', 'Năm'],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.periodSegment, period === key && styles.periodSegmentActive]}
            onPress={() => onChangePeriod(key)}
          >
            <Text style={[styles.periodSegmentText, period === key && styles.periodSegmentTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateButton} onPress={() => onShift(-1)}>
          <Ionicons name="chevron-back" size={17} color="#6D4AAF" />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{periodLabel(period, selectedDate, false)}</Text>
        <TouchableOpacity
          style={[styles.dateButton, !canGoNextPeriod(selectedDate, period) && styles.disabled]}
          disabled={!canGoNextPeriod(selectedDate, period)}
          onPress={() => onShift(1)}
        >
          <Ionicons name="chevron-forward" size={17} color="#6D4AAF" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function OverviewSection({
  data,
  formatMoney,
  theme,
  compareLabel,
  onOpenBudget,
  onOpenCashflow,
  onOpenFund,
}: {
  data: ReturnType<typeof useFinanceCenter>['data']
  formatMoney: (value: number) => string
  theme: any
  compareLabel: string
  onOpenBudget: () => void
  onOpenCashflow: () => void
  onOpenFund: () => void
}) {
  const income = num(data.current.totalIncome)
  const expense = num(data.current.totalExpense)
  const net = num(data.current.net)
  const expenseDelta = data.delta.totalExpense
  const expenseImproved = num(expenseDelta.amount) <= 0

  return (
    <>
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.heroEyebrow, { color: theme.textMuted }]}>TÀI SẢN KHẢ DỤNG HIỆN TẠI</Text>
        <Text style={[styles.heroValue, { color: theme.textPrimary }]}>{formatMoney(num(data.totalAssets))}</Text>
        <Text style={[styles.heroHint, { color: theme.textMuted }]}>
          Chỉ gồm số dư Ví SmartSpend và Sổ tay tiền mặt của bạn
        </Text>
        <View style={styles.balanceRow}>
          <BalanceItem icon="wallet-outline" label="Ví" value={data.walletBalance} formatMoney={formatMoney} />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <BalanceItem icon="book-outline" label="Sổ tay" value={data.cashBalance} formatMoney={formatMoney} />
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricCard label="Thu thực tế" value={income} color="#218A68" icon="arrow-down-outline" formatMoney={formatMoney} theme={theme} />
        <MetricCard label="Chi thực tế" value={expense} color="#C94A67" icon="arrow-up-outline" formatMoney={formatMoney} theme={theme} />
      </View>

      <View style={[styles.netCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View>
          <Text style={[styles.cardEyebrow, { color: theme.textMuted }]}>DÒNG TIỀN RÒNG THỰC TẾ</Text>
          <Text style={[styles.netValue, { color: net >= 0 ? '#218A68' : '#C94A67' }]}>
            {net >= 0 ? '+' : '-'}{formatMoney(Math.abs(net))}
          </Text>
        </View>
        <View style={[styles.deltaBadge, { backgroundColor: expenseImproved ? '#E9F7F1' : '#FFF0F3' }]}>
          <Text style={[styles.deltaText, { color: expenseImproved ? '#218A68' : '#C94A67' }]}>
            Chi {formatDeltaPercent(expenseDelta.percent, false)}
          </Text>
          <Text style={styles.deltaCaption}>so với {compareLabel}</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.card }]} onPress={onOpenBudget}>
        <View style={[styles.featureIcon, { backgroundColor: '#F0EAFE' }]}>
          <Ionicons name="speedometer-outline" size={21} color="#6D4AAF" />
        </View>
        <View style={styles.featureCopy}>
          <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Sức khỏe ngân sách</Text>
          <Text style={[styles.featureText, { color: theme.textMuted }]}>
            {data.budget.activeCount
              ? `${Math.round(num(data.budget.usagePercent))}% đã dùng · ${data.budget.atRiskCount} cần chú ý trong kỳ`
              : 'Không có ngân sách trong kỳ đang xem'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.card }]} onPress={onOpenCashflow}>
        <View style={[styles.featureIcon, { backgroundColor: '#FBE9F1' }]}>
          <Ionicons name="swap-vertical-outline" size={21} color="#B33B6E" />
        </View>
        <View style={styles.featureCopy}>
          <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Dòng tiền Ví</Text>
          <Text style={[styles.featureText, { color: theme.textMuted }]}>
            Theo dõi riêng tiền nạp vào và rút khỏi Ví SmartSpend.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.card }]} onPress={onOpenFund}>
        <View style={[styles.featureIcon, { backgroundColor: '#E8F5F1' }]}>
          <Ionicons name="people-outline" size={21} color="#218A68" />
        </View>
        <View style={styles.featureCopy}>
          <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Dòng tiền Quỹ</Text>
          <Text style={[styles.featureText, { color: theme.textMuted }]}>
            Xem riêng tiền nạp và rút trong các Quỹ chung.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={theme.textMuted} />
      </TouchableOpacity>
    </>
  )
}

function BudgetSection({
  data,
  formatMoney,
  theme,
  onOpenBudgets,
}: {
  data: ReturnType<typeof useFinanceCenter>['data']
  formatMoney: (value: number) => string
  theme: any
  onOpenBudgets: () => void
}) {
  const budget = data.budget
  const progress = Math.min(Math.max(num(budget.usagePercent), 0), 100)
  const color = progress >= 100 ? '#D9486F' : progress >= 80 ? '#D9823D' : '#7655B4'

  return (
    <>
      <View style={styles.sectionIntro}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hiệu quả ngân sách</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Tổng hợp các ngân sách có thời gian giao với kỳ đang xem.
        </Text>
      </View>
      <View style={[styles.budgetHero, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.budgetTop}>
          <View>
            <Text style={[styles.cardEyebrow, { color: theme.textMuted }]}>CÒN CÓ THỂ CHI</Text>
            <Text style={[styles.budgetRemaining, { color: num(budget.remaining) < 0 ? '#C94A67' : theme.textPrimary }]}>
              {formatMoney(Math.abs(num(budget.remaining)))}
            </Text>
          </View>
          <View style={[styles.budgetPercent, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.budgetPercentValue, { color }]}>{Math.round(num(budget.usagePercent))}%</Text>
            <Text style={styles.budgetPercentLabel}>đã dùng</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.budgetStats}>
          <SmallStat label="Hạn mức" value={budget.totalLimit} formatMoney={formatMoney} />
          <SmallStat label="Đã chi" value={budget.spent} formatMoney={formatMoney} />
          <SmallStat label="Trong kỳ" value={budget.activeCount} plain />
        </View>
      </View>

      <View style={styles.alertGrid}>
        <AlertStat label="Gần hạn mức" value={budget.atRiskCount} color="#D9823D" icon="alert-circle-outline" theme={theme} />
        <AlertStat label="Đã vượt" value={budget.overLimitCount} color="#D9486F" icon="warning-outline" theme={theme} />
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Ionicons name="bulb-outline" size={20} color="#6D4AAF" />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          {budget.activeCount === 0
            ? 'Không có ngân sách nào thuộc kỳ đang xem.'
            : budget.atRiskCount > 0
              ? 'Một số ngân sách đang dùng từ 80% hạn mức. Hãy kiểm tra trước khi chi thêm.'
              : 'Các ngân sách đang nằm trong kế hoạch.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onOpenBudgets}>
        <Text style={styles.primaryButtonText}>Mở danh sách ngân sách</Text>
        <Ionicons name="arrow-forward" size={17} color="#FFF" />
      </TouchableOpacity>
    </>
  )
}

function FundSection({ data, formatMoney, theme, onOpenFunds }: any) {
  const income = num(data.current.fund.income)
  const expense = num(data.current.fund.expense)
  const net = num(data.current.fund.net)

  return (
    <>
      <View style={styles.sectionIntro}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Báo cáo Quỹ</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Theo dõi tiền nạp vào và rút khỏi các Quỹ trong kỳ đã chọn.
        </Text>
      </View>

      <View style={styles.metrics}>
        <MetricCard label="Nạp vào Quỹ" value={income} color="#218A68" icon="arrow-down-outline" formatMoney={formatMoney} theme={theme} />
        <MetricCard label="Rút khỏi Quỹ" value={expense} color="#C94A67" icon="arrow-up-outline" formatMoney={formatMoney} theme={theme} />
      </View>

      <View style={[styles.fundNetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.fundNetIcon}>
          <Ionicons name="people-outline" size={23} color="#6D4AAF" />
        </View>
        <View style={styles.featureCopy}>
          <Text style={[styles.cardEyebrow, { color: theme.textMuted }]}>DÒNG TIỀN QUỸ RÒNG</Text>
          <Text style={[styles.fundNetValue, { color: net >= 0 ? '#218A68' : '#C94A67' }]}>
            {net >= 0 ? '+' : '-'}{formatMoney(Math.abs(net))}
          </Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: '#F3EEF9' }]}>
        <Ionicons name="information-circle-outline" size={20} color="#6D4AAF" />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Nạp và rút Quỹ là luân chuyển tiền, không được tính thành thu nhập hoặc chi tiêu cá nhân.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onOpenFunds}>
        <Text style={styles.primaryButtonText}>Mở danh sách Quỹ</Text>
        <Ionicons name="arrow-forward" size={17} color="#FFF" />
      </TouchableOpacity>
    </>
  )
}

function BalanceItem({ icon, label, value, formatMoney }: any) {
  return (
    <View style={styles.balanceItem}>
      <Ionicons name={icon} size={16} color="#6D4AAF" />
      <View>
        <Text style={styles.balanceLabel}>{label}</Text>
        <Text style={styles.balanceValue}>{formatMoney(num(value))}</Text>
      </View>
    </View>
  )
}

function MetricCard({ label, value, color, icon, formatMoney, theme }: any) {
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{formatMoney(num(value))}</Text>
    </View>
  )
}

function SmallStat({ label, value, formatMoney, plain }: any) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <Text style={styles.smallStatValue}>{plain ? value : formatMoney(num(value))}</Text>
    </View>
  )
}

function AlertStat({ label, value, color, icon, theme }: any) {
  return (
    <View style={[styles.alertStat, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.alertValue, { color }]}>{value}</Text>
      <Text style={[styles.alertLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  )
}
