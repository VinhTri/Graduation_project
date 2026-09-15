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
import type { CategoryGroup } from '@/shared/types/category'
import { useNotebookCashReportData } from '../../report/useNotebookCashReportData'
import {
  buildNotebookDistribution,
  buildNotebookDualTrend,
  formatNotebookReportCurrency,
  getNotebookReportRange,
  parseNotebookTxDate,
  startOfWeek,
  isSameWeek,
  type NotebookReportDateFilter,
  type NotebookReportTab,
  type NotebookReportViewMode,
} from '../../report/notebookReportUtils'
import type { NotebookTransactionItem } from '../../utils/notebookMappers'
import { stripDeletedCategorySuffix } from '../../utils/notebookMappers'
import { styles } from './NotebookReport.styles'

type Props = {
  /** true khi tab Báo cáo sổ tay đang mở */
  active?: boolean
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PRIMARY = PASTEL_PALETTE.accentDeep
const EXPENSE_LINE = '#EF4444'
const INCOME_LINE = '#10B981'
/** Màu điểm chạm — tím, tránh trùng đỏ của chi. */
const POINTER_DOT = PASTEL_PALETTE.subtitle
const CATEGORY_VISIBLE = 4
const CATEGORY_CARD_GAP = 8
const CATEGORY_SIDE_PAD = 4
const CATEGORY_CARD_WIDTH =
  (SCREEN_WIDTH - 40 - CATEGORY_SIDE_PAD * 2 - CATEGORY_CARD_GAP * (CATEGORY_VISIBLE - 1)) /
  CATEGORY_VISIBLE

/**
 * Báo cáo sổ tay tiền mặt — UI biểu đồ tách riêng khỏi báo cáo ví SmartSpend.
 * Tự load dữ liệu YEAR, không dùng chung filter lịch sử.
 */
export function NotebookReport({ active = true }: Props) {
  const { transactions, categories, loading, refreshing, refresh } =
    useNotebookCashReportData(active)

  const [viewMode, setViewMode] = useState<NotebookReportViewMode>('pie')
  const [activeTab, setActiveTab] = useState<NotebookReportTab>('expense')
  const [dateFilter, setDateFilter] = useState<NotebookReportDateFilter>('month')
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

  const txType = activeTab === 'expense' ? 'EXPENSE' : 'INCOME'

  const resolveMeta = useMemo(
    () => createCategoryResolver(categories),
    [categories],
  )
  const resolveGroupMeta = useMemo(
    () => createGroupResolver(categories),
    [categories],
  )

  const rangedTransactions = useMemo(() => {
    const { start, end } = getNotebookReportRange(dateFilter, selectedDate)
    return transactions.filter((tx) => {
      const d = parseNotebookTxDate(tx)
      return d >= start && d <= end
    })
  }, [transactions, dateFilter, selectedDate])

  const distribution = useMemo(
    () => buildNotebookDistribution(
      rangedTransactions,
      txType,
      viewMode === 'group' ? resolveGroupMeta : resolveMeta,
    ),
    [rangedTransactions, txType, viewMode, resolveGroupMeta, resolveMeta],
  )

  const isDistributionMode = viewMode === 'pie' || viewMode === 'group'

  const dualTrend = useMemo(
    () => buildNotebookDualTrend(transactions, dateFilter, selectedDate),
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

  const expenseLineData = useMemo(
    () =>
      dualTrend.expense.map((item) => ({
        value: item.value,
        label: item.label,
        labelTextStyle: {
          color: item.isCurrent ? PRIMARY : PASTEL_PALETTE.textMuted,
          fontSize: 10,
          width: dateFilter === 'month' ? 22 : 28,
          textAlign: 'center' as const,
        },
      })),
    [dualTrend.expense, dateFilter],
  )

  const incomeLineData = useMemo(
    () =>
      dualTrend.income.map((item) => ({
        value: item.value,
        label: item.label,
      })),
    [dualTrend.income],
  )

  const totalAmount = useMemo(
    () => distribution.reduce((sum, item) => sum + item.totalAmount, 0),
    [distribution],
  )

  const hasTrendData = dualTrend.maxValue > 0

  const lineChartWidth = useMemo(() => {
    const spacing = dateFilter === 'month' ? 24 : dateFilter === 'week' ? 48 : 36
    return Math.max(SCREEN_WIDTH - 56, dualTrend.expense.length * spacing + 48)
  }, [dualTrend.expense.length, dateFilter])

  const chartMaxValue = Math.max(dualTrend.maxValue * 1.15, 1)

  const trendDataSet = useMemo(
    () =>
      [
        {
          data: expenseLineData,
          color: EXPENSE_LINE,
          thickness: 2.5,
          hideDataPoints: false,
          dataPointsColor: EXPENSE_LINE,
          dataPointsRadius: 4,
        },
        {
          data: incomeLineData,
          color: INCOME_LINE,
          thickness: 2.5,
          hideDataPoints: false,
          dataPointsColor: INCOME_LINE,
          dataPointsRadius: 4,
        },
      ] as any,
    [expenseLineData, incomeLineData],
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
          <Text style={styles.sectionTitle}>Tình hình thu chi</Text>
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
              style={[styles.toggleButton, viewMode === 'group' && styles.toggleButtonActive]}
              onPress={() => setViewMode('group')}
            >
              <Ionicons
                name="folder-open-outline"
                size={16}
                color={viewMode === 'group' ? PRIMARY : PASTEL_PALETTE.textMuted}
              />
              <Text style={[styles.toggleText, viewMode === 'group' && styles.toggleTextActive]}>
                Nhóm
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
          <TouchableOpacity
            style={styles.currentDateBtn}
            onPress={() => setSelectedDate(new Date())}
            activeOpacity={0.75}
          >
            <Text style={styles.currentDateText}>Hiện tại</Text>
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
          <Modal visible={showPicker} transparent animationType="fade">
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowPicker(false)}
            >
              <TouchableWithoutFeedback>
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Chọn ngày báo cáo</Text>
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
              style={[styles.summaryCard, activeTab === 'expense' && styles.summaryCardActive]}
              onPress={() => setActiveTab('expense')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLabelRow}>
                <Feather
                  name="trending-up"
                  size={16}
                  color={activeTab === 'expense' ? PRIMARY : '#DC2626'}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    activeTab === 'expense' && styles.summaryLabelActive,
                  ]}
                >
                  Chi tiêu
                </Text>
              </View>
              <Text style={styles.summaryValue}>
                {activeTab === 'expense'
                  ? formatNotebookReportCurrency(totalAmount)
                  : '******'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.summaryCard, activeTab === 'income' && styles.summaryCardActive]}
              onPress={() => setActiveTab('income')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLabelRow}>
                <Feather
                  name="trending-down"
                  size={16}
                  color={activeTab === 'income' ? PRIMARY : PASTEL_PALETTE.textMuted}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    activeTab === 'income' && styles.summaryLabelActive,
                  ]}
                >
                  Thu nhập
                </Text>
              </View>
              <Text style={styles.summaryValue}>
                {activeTab === 'income'
                  ? formatNotebookReportCurrency(totalAmount)
                  : '******'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'bar' ? (
          <View style={styles.lineChartLegend}>
            <View style={styles.dualLegendItem}>
              <View style={[styles.lineTrendDot, { backgroundColor: EXPENSE_LINE }]} />
              <Text style={styles.lineChartLegendText}>Chi tiêu</Text>
            </View>
            <View style={styles.dualLegendItem}>
              <View style={[styles.lineTrendDot, { backgroundColor: INCOME_LINE }]} />
              <Text style={styles.lineChartLegendText}>Thu nhập</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.chartContainer}>
          {isDistributionMode ? (
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
                    Chưa có dữ liệu {viewMode === 'group' ? 'nhóm' : 'danh mục'} trong kỳ này
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.lineChartWrapper}>
              {hasTrendData ? (
                <>
                  <View style={styles.fixedValueBanner}>
                    {pointerIndex >= 0 && pointerIndex < dualTrend.expense.length ? (
                      <>
                        <Text style={styles.fixedValueDay}>
                          {dualTrend.expense[pointerIndex].timeLabel}
                        </Text>
                        <View style={styles.fixedValueRow}>
                          <Text style={[styles.fixedValueText, { color: EXPENSE_LINE }]}>
                            Chi: {formatNotebookReportCurrency(dualTrend.expense[pointerIndex].value)}
                          </Text>
                          <Text style={[styles.fixedValueText, { color: INCOME_LINE }]}>
                            Thu: {formatNotebookReportCurrency(dualTrend.income[pointerIndex].value)}
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

        {isDistributionMode && distribution.length > 0 ? (
          <>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                {viewMode === 'group' ? 'Nhóm' : 'Danh mục'} ({distribution.length})
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
  return formatNotebookReportCurrency(value)
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

  return (tx: NotebookTransactionItem) => {
    const active = tx.categoryId != null ? byId.get(tx.categoryId) : undefined
    const deleted = !!tx.categoryDeleted || (tx.categoryId != null && !active)
    const baseName = stripDeletedCategorySuffix(active?.label || tx.categoryName || 'Khác')

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

function createGroupResolver(categories: CategoryGroup[]) {
  const byCategoryId = new Map<number, CategoryGroup>()
  categories.forEach((group) => {
    group.items.forEach((item) => byCategoryId.set(item.id, group))
  })

  return (tx: NotebookTransactionItem) => {
    const group = tx.categoryId != null ? byCategoryId.get(tx.categoryId) : undefined
    if (group) {
      return {
        key: `group-${group.id}`,
        icon: group.icon || 'folder-outline',
        color: group.color || PASTEL_PALETTE.accentDeep,
        label: group.title,
        deleted: false,
      }
    }
    return {
      key: 'group-other',
      icon: 'ellipsis-horizontal-circle-outline',
      color: PASTEL_PALETTE.textMuted,
      label: 'Khác',
      deleted: false,
    }
  }
}
