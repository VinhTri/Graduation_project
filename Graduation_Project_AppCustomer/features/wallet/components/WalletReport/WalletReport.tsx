import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
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
import { Feather, Ionicons } from '@expo/vector-icons'
import { LineChart, PieChart } from 'react-native-gifted-charts'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { resolveSystemWalletCategory } from '@/shared/constants/defaultCategories'
import type { CategoryGroup } from '@/shared/types/category'
import { useWalletReportData } from '../../report/useWalletReportData'
import {
  buildWalletDistribution,
  buildWalletDualTrend,
  formatWalletReportCurrency,
  getWalletReportRange,
  parseWalletTxDate,
  startOfWeek,
  isSameWeek,
  stripDeletedCategorySuffix,
  type WalletReportDateFilter,
  type WalletReportTab,
  type WalletReportTx,
  type WalletReportViewMode,
} from '../../report/walletReportUtils'
import { styles } from './WalletReport.styles'

type Props = {
  /** true khi màn báo cáo ví đang mở */
  active?: boolean
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PRIMARY = PASTEL_PALETTE.accentDeep
const CATEGORY_VISIBLE = 4
const CATEGORY_CARD_GAP = 8
const CATEGORY_SIDE_PAD = 4
const CATEGORY_CARD_WIDTH =
  (SCREEN_WIDTH - 40 - CATEGORY_SIDE_PAD * 2 - CATEGORY_CARD_GAP * (CATEGORY_VISIBLE - 1)) /
  CATEGORY_VISIBLE

/**
 * Báo cáo ví SmartSpend — UI biểu đồ tách riêng khỏi báo cáo sổ tay.
 * Dùng GET /wallets/transactions, không share module notebook.
 */
export function WalletReport({ active = true }: Props) {
  const { transactions, categories, loading, refreshing, refresh } =
    useWalletReportData(active)

  const [viewMode, setViewMode] = useState<WalletReportViewMode>('pie')
  const [activeTab, setActiveTab] = useState<WalletReportTab>('withdraw')
  const [dateFilter, setDateFilter] = useState<WalletReportDateFilter>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const [pointerIndex, setPointerIndex] = useState(-1)
  const [focusedPieIndex, setFocusedPieIndex] = useState(-1)
  const pointerIndexRef = useRef(-1)

  useEffect(() => {
    pointerIndexRef.current = -1
    setPointerIndex(-1)
  }, [dateFilter, selectedDate, viewMode])

  useEffect(() => {
    setFocusedPieIndex(-1)
  }, [dateFilter, selectedDate, activeTab, viewMode])

  const txType = activeTab === 'withdraw' ? 'WITHDRAW' : 'TOP_UP'

  const resolveMeta = useMemo(
    () => createCategoryResolver(categories),
    [categories],
  )

  const rangedTransactions = useMemo(() => {
    const { start, end } = getWalletReportRange(dateFilter, selectedDate)
    return transactions.filter((tx) => {
      const d = parseWalletTxDate(tx)
      return d >= start && d <= end
    })
  }, [transactions, dateFilter, selectedDate])

  const distribution = useMemo(
    () => buildWalletDistribution(rangedTransactions, txType, resolveMeta),
    [rangedTransactions, txType, resolveMeta],
  )

  const dualTrend = useMemo(
    () => buildWalletDualTrend(transactions, dateFilter, selectedDate),
    [transactions, dateFilter, selectedDate],
  )

  const pieChartData = useMemo(
    () =>
      distribution.map((item, index) => ({
        value: item.percentage,
        color: item.color || PRIMARY,
        focused: focusedPieIndex === index,
      })),
    [distribution, focusedPieIndex],
  )

  const togglePieFocus = (index: number) => {
    setFocusedPieIndex((prev) => (prev === index ? -1 : index))
  }

  const withdrawLineData = useMemo(
    () =>
      dualTrend.withdraw.map((item) => ({
        value: item.value,
        label: item.label,
        labelTextStyle: {
          color: item.isCurrent ? PRIMARY : PASTEL_PALETTE.textMuted,
          fontSize: 10,
          width: dateFilter === 'month' ? 22 : 28,
          textAlign: 'center' as const,
        },
      })),
    [dualTrend.withdraw, dateFilter],
  )

  const topupLineData = useMemo(
    () =>
      dualTrend.topup.map((item) => ({
        value: item.value,
        label: item.label,
      })),
    [dualTrend.topup],
  )

  const totalAmount = useMemo(
    () => distribution.reduce((sum, item) => sum + item.totalAmount, 0),
    [distribution],
  )

  const hasTrendData = dualTrend.maxValue > 0

  const lineChartWidth = useMemo(() => {
    const spacing = dateFilter === 'month' ? 24 : dateFilter === 'week' ? 48 : 36
    return Math.max(SCREEN_WIDTH - 56, dualTrend.withdraw.length * spacing + 48)
  }, [dualTrend.withdraw.length, dateFilter])

  const chartMaxValue = Math.max(dualTrend.maxValue * 1.15, 1)

  const WITHDRAW_LINE = '#EF4444'
  const TOPUP_LINE = '#10B981'
  /** Màu điểm chạm — tím, tránh trùng đỏ của chi */
  const POINTER_DOT = PASTEL_PALETTE.subtitle

  const trendDataSet = useMemo(
    () =>
      [
        {
          data: withdrawLineData,
          color: WITHDRAW_LINE,
          thickness: 2.5,
          hideDataPoints: false,
          dataPointsColor: WITHDRAW_LINE,
          dataPointsRadius: 4,
        },
        {
          data: topupLineData,
          color: TOPUP_LINE,
          thickness: 2.5,
          hideDataPoints: false,
          dataPointsColor: TOPUP_LINE,
          dataPointsRadius: 4,
        },
      ] as any,
    [withdrawLineData, topupLineData],
  )

  const handlePointerProps = useCallback(({ pointerIndex: idx }: { pointerIndex: number }) => {
    if (pointerIndexRef.current === idx) return
    pointerIndexRef.current = idx
    setPointerIndex((prev) => (prev === idx ? prev : idx))
  }, [])

  const pointerConfig = useMemo(
    () => ({
      pointerStripUptoDataPoint: true,
      pointerStripHeight: 170,
      pointerStripColor: '#94A3B855',
      pointerStripWidth: 1,
      pointerColor: POINTER_DOT,
      radius: 5,
      pointerLabelWidth: 1,
      pointerLabelHeight: 1,
      autoAdjustPointerLabelPosition: false,
      activatePointersOnLongPress: false,
      activatePointersInstantlyOnTouch: true,
      persistPointer: true,
      pointerLabelComponent: () => null,
    }),
    [],
  )

  const formatTrendYLabel = useCallback((label: string) => {
    const val = Number(label)
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}Tr`
    if (val >= 1000) return `${Math.round(val / 1000)}K`
    return String(Math.round(val))
  }, [])

  const getDateLabel = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    if (dateFilter === 'week') {
      if (isSameWeek(selectedDate, now)) return 'Tuần này'
      const start = startOfWeek(selectedDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
    }
    if (dateFilter === 'month') {
      if (
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear
      ) {
        return 'Tháng này'
      }
      return `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
    }
    if (selectedDate.getFullYear() === currentYear) return 'Năm nay'
    return `Năm ${selectedDate.getFullYear()}`
  }

  const shiftPeriod = (dir: -1 | 1) => {
    const next = new Date(selectedDate)
    if (dateFilter === 'week') next.setDate(next.getDate() + dir * 7)
    else if (dateFilter === 'month') next.setMonth(next.getMonth() + dir)
    else next.setFullYear(next.getFullYear() + dir)
    if (next > new Date()) return
    setSelectedDate(next)
  }

  const canGoNext = () => {
    const probe = new Date(selectedDate)
    if (dateFilter === 'week') probe.setDate(probe.getDate() + 7)
    else if (dateFilter === 'month') probe.setMonth(probe.getMonth() + 1)
    else probe.setFullYear(probe.getFullYear() + 1)
    return probe <= new Date()
  }

  const applyPickedDate = (date?: Date) => {
    if (!date) return
    const now = new Date()
    setSelectedDate(date > now ? now : date)
  }

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    )
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 160 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={PRIMARY}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tình hình nạp / rút</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'pie' && styles.toggleButtonActive]}
              onPress={() => setViewMode('pie')}
            >
              <Ionicons
                name="pie-chart"
                size={16}
                color={viewMode === 'pie' ? PRIMARY : PASTEL_PALETTE.textMuted}
              />
              <Text style={[styles.toggleText, viewMode === 'pie' && styles.toggleTextActive]}>
                Phân bổ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'bar' && styles.toggleButtonActive]}
              onPress={() => setViewMode('bar')}
            >
              <Ionicons
                name="analytics-outline"
                size={16}
                color={viewMode === 'bar' ? PRIMARY : PASTEL_PALETTE.textMuted}
              />
              <Text style={[styles.toggleText, viewMode === 'bar' && styles.toggleTextActive]}>
                Xu hướng
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.periodChips}>
          {(
            [
              { key: 'week', label: 'Tuần' },
              { key: 'month', label: 'Tháng' },
              { key: 'year', label: 'Năm' },
            ] as const
          ).map((item) => {
            const isActive = dateFilter === item.key
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.periodChip, isActive && styles.periodChipActive]}
                onPress={() => setDateFilter(item.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodChipText, isActive && styles.periodChipTextActive]}>
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
                    <Text style={styles.pickerTitle}>Chọn ngày báo cáo ví</Text>
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

        {viewMode === 'pie' ? (
          <View style={styles.summaryRow}>
            <TouchableOpacity
              style={[styles.summaryCard, activeTab === 'withdraw' && styles.summaryCardActive]}
              onPress={() => setActiveTab('withdraw')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLabelRow}>
                <Feather
                  name="arrow-up"
                  size={16}
                  color={activeTab === 'withdraw' ? PRIMARY : '#DC2626'}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    activeTab === 'withdraw' && styles.summaryLabelActive,
                  ]}
                >
                  Rút tiền
                </Text>
              </View>
              <Text style={styles.summaryValue}>
                {activeTab === 'withdraw'
                  ? formatWalletReportCurrency(totalAmount)
                  : '******'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.summaryCard, activeTab === 'topup' && styles.summaryCardActive]}
              onPress={() => setActiveTab('topup')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLabelRow}>
                <Feather
                  name="arrow-down"
                  size={16}
                  color={activeTab === 'topup' ? PRIMARY : PASTEL_PALETTE.textMuted}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    activeTab === 'topup' && styles.summaryLabelActive,
                  ]}
                >
                  Nạp tiền
                </Text>
              </View>
              <Text style={styles.summaryValue}>
                {activeTab === 'topup'
                  ? formatWalletReportCurrency(totalAmount)
                  : '******'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lineChartLegend}>
            <View style={styles.dualLegendItem}>
              <View style={[styles.lineTrendDot, { backgroundColor: WITHDRAW_LINE }]} />
              <Text style={styles.lineChartLegendText}>Rút tiền</Text>
            </View>
            <View style={styles.dualLegendItem}>
              <View style={[styles.lineTrendDot, { backgroundColor: TOPUP_LINE }]} />
              <Text style={styles.lineChartLegendText}>Nạp tiền</Text>
            </View>
          </View>
        )}

        <View style={styles.chartContainer}>
          {viewMode === 'pie' ? (
            <View style={styles.pieChartWrapper}>
              {pieChartData.length > 0 ? (
                <View style={styles.donutContainer}>
                  <PieChart
                    data={pieChartData as any}
                    donut
                    radius={98}
                    innerRadius={62}
                    innerCircleColor={PASTEL_PALETTE.white}
                    strokeWidth={2}
                    strokeColor={PASTEL_PALETTE.white}
                    focusOnPress
                    toggleFocusOnPress={false}
                    focusedPieIndex={focusedPieIndex}
                    extraRadius={12}
                    onPress={(_: unknown, index: number) => togglePieFocus(index)}
                    centerLabelComponent={(selectedIndex?: number) => {
                      const idx =
                        typeof selectedIndex === 'number' && selectedIndex >= 0
                          ? selectedIndex
                          : focusedPieIndex
                      const item = idx >= 0 ? distribution[idx] : null

                      if (!item) {
                        return (
                          <View style={styles.donutCenter}>
                            <Text style={styles.donutCenterHint}>Tổng</Text>
                            <Text style={styles.donutCenterTotal} numberOfLines={1}>
                              {formatCompactAmount(totalAmount)}
                            </Text>
                            <Text style={styles.donutCenterTap}>Chạm màu để xem</Text>
                          </View>
                        )
                      }

                      return (
                        <View style={styles.donutCenter}>
                          <View
                            style={[
                              styles.donutCenterIcon,
                              { backgroundColor: `${item.color}22` },
                            ]}
                          >
                            {renderCategoryIcon(item.icon, item.color, 20)}
                          </View>
                          <Text
                            style={[styles.donutCenterPct, { color: item.color }]}
                            numberOfLines={1}
                          >
                            {item.percentage.toFixed(1)}%
                          </Text>
                          <Text style={styles.donutCenterName} numberOfLines={2}>
                            {item.categoryName}
                          </Text>
                          {item.deleted ? (
                            <Text style={styles.donutCenterDeleted}>(đã xóa)</Text>
                          ) : null}
                        </View>
                      )
                    }}
                  />
                </View>
              ) : (
                <View style={styles.donutContainer}>
                  <Text style={styles.emptyChartText}>
                    Chưa có dữ liệu danh mục trong kỳ này
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.lineChartWrapper}>
              {hasTrendData ? (
                <>
                  <View style={styles.fixedValueBanner}>
                    {pointerIndex >= 0 && pointerIndex < dualTrend.withdraw.length ? (
                      <>
                        <Text style={styles.fixedValueDay}>
                          {dualTrend.withdraw[pointerIndex].timeLabel}
                        </Text>
                        <View style={styles.fixedValueRow}>
                          <Text style={[styles.fixedValueText, { color: WITHDRAW_LINE }]}>
                            Rút: {formatWalletReportCurrency(dualTrend.withdraw[pointerIndex].value)}
                          </Text>
                          <Text style={[styles.fixedValueText, { color: TOPUP_LINE }]}>
                            Nạp: {formatWalletReportCurrency(dualTrend.topup[pointerIndex].value)}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.fixedValueHint}>Chạm vào biểu đồ để xem giá trị</Text>
                    )}
                  </View>
                  <View style={styles.lineChartPanel}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.lineChartScroll}
                    >
                      <LineChart
                        key={`trend-${dateFilter}-${selectedDate.getTime()}`}
                        dataSet={trendDataSet}
                        width={lineChartWidth}
                        height={220}
                        overflowTop={48}
                        maxValue={chartMaxValue}
                        mostNegativeValue={0}
                        curved={false}
                        spacing={dateFilter === 'month' ? 22 : dateFilter === 'week' ? 44 : 34}
                        initialSpacing={20}
                        endSpacing={20}
                        noOfSections={4}
                        hideRules={false}
                        rulesColor="#E2E8F0"
                        rulesType="solid"
                        xAxisThickness={1}
                        xAxisColor="#CBD5E1"
                        yAxisThickness={0}
                        yAxisTextStyle={styles.yAxisLabel}
                        formatYLabel={formatTrendYLabel}
                        getPointerProps={handlePointerProps}
                        pointerConfig={pointerConfig}
                      />
                    </ScrollView>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyChartText}>
                  Chưa có dữ liệu xu hướng trong kỳ này
                </Text>
              )}
            </View>
          )}
        </View>

        {viewMode === 'pie' && distribution.length > 0 ? (
          <>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                Danh mục ({distribution.length})
              </Text>
              {distribution.length > 4 ? (
                <View style={styles.categorySwipeHint}>
                  <Text style={styles.categorySwipeHintText}>Vuốt</Text>
                  <Ionicons name="chevron-forward" size={14} color={PRIMARY} />
                </View>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CATEGORY_CARD_WIDTH + CATEGORY_CARD_GAP}
              snapToAlignment="start"
              contentContainerStyle={styles.categoryScrollContent}
            >
              {distribution.map((item, index) => {
                const isFocused = focusedPieIndex === index
                return (
                  <TouchableOpacity
                    key={`${item.key}-${index}`}
                    style={[
                      styles.categoryCard,
                      { width: CATEGORY_CARD_WIDTH },
                      isFocused && {
                        backgroundColor: `${item.color}12`,
                        borderColor: item.color,
                      },
                    ]}
                    onPress={() => togglePieFocus(index)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.categoryCardIcon,
                        { backgroundColor: `${item.color}22` },
                      ]}
                    >
                      {renderCategoryIcon(item.icon, item.color, 20)}
                    </View>
                    <Text style={[styles.categoryCardPct, { color: item.color }]} numberOfLines={1}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                    <Text style={styles.categoryCardName} numberOfLines={2}>
                      {item.categoryName}
                    </Text>
                    {item.deleted ? (
                      <Text style={styles.categoryCardDeleted}>(đã xóa)</Text>
                    ) : null}
                    <Text style={styles.categoryCardAmount} numberOfLines={1}>
                      {formatCompactAmount(item.totalAmount)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </>
        ) : null}
      </View>
    </ScrollView>
  )
}

function formatCompactAmount(amount: number) {
  const value = Math.round(amount || 0)
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`
  return formatWalletReportCurrency(value)
}

function renderCategoryIcon(iconName: string | undefined, color: string, size: number) {
  return (
    <Ionicons
      name={
        (iconName && iconName !== '?'
          ? iconName
          : 'help-circle-outline') as keyof typeof Ionicons.glyphMap
      }
      size={size}
      color={color}
    />
  )
}

function createCategoryResolver(categories: CategoryGroup[]) {
  const byId = new Map<number, { icon: string; color: string; label: string }>()
  categories.forEach((group) => {
    group.items.forEach((item) => {
      byId.set(item.id, {
        icon: item.icon,
        color: item.color,
        label: item.label,
      })
    })
  })

  return (tx: WalletReportTx) => {
    const active = tx.categoryId != null ? byId.get(tx.categoryId) : undefined
    const rawName = active?.label || tx.categoryName
    const system = resolveSystemWalletCategory(
      rawName,
      tx.type === 'TOP_UP' ? 'INCOME' : 'EXPENSE',
    )
    if (system) {
      return {
        icon: tx.categoryIcon || active?.icon || system.icon,
        color: tx.categoryColor || active?.color || system.color,
        label: system.label,
        deleted: false,
      }
    }

    const deleted = !!tx.categoryDeleted || (tx.categoryId != null && !active)
    const baseName = stripDeletedCategorySuffix(rawName || 'Khác')

    if (!deleted) {
      if (active) {
        return { ...active, label: stripDeletedCategorySuffix(active.label), deleted: false }
      }
      return {
        icon: tx.categoryIcon || 'pricetag',
        color: tx.categoryColor || PASTEL_PALETTE.accentDeep,
        label: baseName,
        deleted: false,
      }
    }

    return {
      icon: tx.categoryIcon || active?.icon || 'pricetag',
      color: tx.categoryColor || active?.color || PASTEL_PALETTE.accentDeep,
      label: baseName,
      deleted: true,
    }
  }
}
