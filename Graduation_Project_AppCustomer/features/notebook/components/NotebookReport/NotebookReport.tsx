import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import Colors from '../../../../shared/constants/Colors';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { TransactionItem } from '../RecentTransactions/RecentTransactions.types';
import { styles } from './NotebookReport.styles';

type Props = {
  transactions: TransactionItem[];
};
import { DateRangeSelector, DateFilterType } from '../DateRangeSelector/DateRangeSelector';

type ViewMode = 'pie' | 'bar';
type ActiveTab = 'expense' | 'income';

type DistRow = {
  key: string;
  categoryName: string;
  icon: string;
  color: string;
  totalAmount: number;
  percentage: number;
};

type TrendPoint = {
  value: number;
  label: string;
  fullLabel: string;
  isCurrent?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const formatCurrency = (amount: number) =>
  `${Math.round(amount).toLocaleString('vi-VN')}đ`;

const parseTxDate = (tx: TransactionItem): Date => {
  if (tx.createdAt) {
    const d = new Date(tx.createdAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const now = new Date();
  if (tx.date === 'Hôm nay') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  if (tx.date === 'Hôm qua') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  return now;
};

const startOfWeek = (d: Date) => {
  const start = new Date(d);
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getRange = (filter: DateFilterType, selected: Date) => {
  const d = new Date(selected);
  let start: Date;
  let end: Date;
  if (filter === 'week') {
    start = startOfWeek(d);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (filter === 'year') {
    start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
};

const buildDistribution = (
  txs: TransactionItem[],
  type: 'EXPENSE' | 'INCOME'
): DistRow[] => {
  const map = new Map<string, Omit<DistRow, 'percentage'>>();
  let total = 0;

  txs.forEach((tx) => {
    if (tx.type !== type) return;
    total += tx.amount;
    const key = String(tx.categoryId ?? `${tx.categoryIcon}|${tx.categoryColor}|${tx.categoryLabel || tx.title}`);
    const name = tx.categoryLabel || tx.title;
    const prev = map.get(key);
    if (prev) {
      prev.totalAmount += tx.amount;
    } else {
      map.set(key, {
        key,
        categoryName: name,
        icon: tx.categoryIcon,
        color: tx.categoryColor || Colors.primary,
        totalAmount: tx.amount,
      });
    }
  });

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      percentage: total > 0 ? (row.totalAmount / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

const buildTrend = (
  txs: TransactionItem[],
  type: 'EXPENSE' | 'INCOME',
  filter: DateFilterType,
  selected: Date
): TrendPoint[] => {
  const { start, end } = getRange(filter, selected);
  const filtered = txs.filter((tx) => {
    if (tx.type !== type) return false;
    const d = parseTxDate(tx);
    return d >= start && d <= end;
  });

  if (filter === 'week') {
    return WEEKDAY_LABELS.map((label, i) => {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const value = filtered
        .filter((tx) => {
          const d = parseTxDate(tx);
          return d >= dayStart && d <= dayEnd;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
      const today = new Date();
      const isCurrent =
        dayStart.getFullYear() === today.getFullYear() &&
        dayStart.getMonth() === today.getMonth() &&
        dayStart.getDate() === today.getDate();
      return { value, label, fullLabel: label, isCurrent };
    });
  }

  if (filter === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      const value = filtered
        .filter((tx) => parseTxDate(tx).getMonth() === m)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        value,
        label: `T${m + 1}`,
        fullLabel: `T${m + 1}`,
        isCurrent: m === selected.getMonth() && selected.getFullYear() === new Date().getFullYear(),
      };
    });
  }

  // month — mỗi ngày trong tháng
  const daysInMonth = end.getDate();
  const today = new Date();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const value = filtered
      .filter((tx) => parseTxDate(tx).getDate() === day)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const showLabel = day === 1 || day % 5 === 0 || day === daysInMonth;
    return {
      value,
      label: showLabel ? String(day) : '',
      fullLabel: String(day),
      isCurrent:
        day === today.getDate() &&
        selected.getMonth() === today.getMonth() &&
        selected.getFullYear() === today.getFullYear(),
    };
  });
};

export const NotebookReport = ({ transactions }: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>('pie');
  const [activeTab, setActiveTab] = useState<ActiveTab>('expense');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  const txType = activeTab === 'expense' ? 'EXPENSE' : 'INCOME';

  const rangedTransactions = useMemo(() => {
    const { start, end } = getRange(dateFilter, selectedDate);
    return transactions.filter((tx) => {
      const d = parseTxDate(tx);
      return d >= start && d <= end;
    });
  }, [transactions, dateFilter, selectedDate]);

  const distribution = useMemo(
    () => buildDistribution(rangedTransactions, txType),
    [rangedTransactions, txType]
  );

  useEffect(() => {
    setSelectedCategoryKey(null);
  }, [distribution]);

  useEffect(() => {
    setSelectedBarIndex(null);
  }, [dateFilter, selectedDate, activeTab]);

  const trendData = useMemo(
    () => buildTrend(transactions, txType, dateFilter, selectedDate),
    [transactions, txType, dateFilter, selectedDate]
  );

  const pieChartData = useMemo(
    () =>
      distribution.map((item) => {
        const isSelected = selectedCategoryKey === item.key;
        return {
          value: item.percentage,
          color: item.color || Colors.primary,
          focused: isSelected,
          onPress: () => setSelectedCategoryKey(isSelected ? null : item.key),
        };
      }),
    [distribution, selectedCategoryKey]
  );

  const trendColor = useMemo(() => {
    if (trendData.length < 2) return '#2563EB';
    const firstVal = trendData.find((d) => d.value > 0)?.value ?? trendData[0].value;
    const lastVal = trendData[trendData.length - 1]?.value ?? 0;
    return lastVal >= firstVal ? '#10B981' : '#EF4444';
  }, [trendData]);

  const barChartData = useMemo(
    () =>
      trendData.map((item, index) => {
        const isSelected = selectedBarIndex === index;
        const hasSelection = selectedBarIndex !== null;
        const defaultColor = item.isCurrent ? Colors.primary : trendColor;
        
        return {
          value: item.value,
          label: item.label,
          frontColor: hasSelection ? (isSelected ? defaultColor : '#E2E8F0') : defaultColor,
          onPress: () => setSelectedBarIndex(isSelected ? null : index),
          labelTextStyle: {
            color: hasSelection ? (isSelected ? Colors.primary : Colors.textMuted) : (item.isCurrent ? Colors.primary : Colors.textMuted),
            fontSize: 10,
            width: dateFilter === 'month' ? 22 : 28,
            textAlign: 'center' as const,
          },
        };
      }),
    [trendData, dateFilter, selectedBarIndex, trendColor]
  );

  const totalAmount = useMemo(() => {
    if (viewMode === 'pie') {
      return distribution.reduce((sum, item) => sum + item.totalAmount, 0);
    }
    return trendData.reduce((sum, item) => sum + item.value, 0);
  }, [viewMode, distribution, trendData]);

  const chartWidth = useMemo(() => {
    const spacing = dateFilter === 'month' ? 22 : dateFilter === 'week' ? 44 : 34;
    return Math.max(SCREEN_WIDTH - 56, trendData.length * spacing + 48);
  }, [trendData.length, dateFilter]);

  const renderCategoryIcon = (iconName: string | undefined, color: string, size: number) => (
    <Ionicons
      name={(iconName && iconName !== '?' ? iconName : 'help-circle-outline') as keyof typeof Ionicons.glyphMap}
      size={size}
      color={color}
    />
  );

  return (
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
              color={viewMode === 'pie' ? Colors.primary : Colors.textMuted}
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
              name="bar-chart"
              size={16}
              color={viewMode === 'bar' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.toggleText, viewMode === 'bar' && styles.toggleTextActive]}>
              Xu hướng
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <DateRangeSelector
        dateFilter={dateFilter}
        selectedDate={selectedDate}
        onChangeFilter={setDateFilter}
        onChangeDate={setSelectedDate}
      />

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
              color={activeTab === 'expense' ? Colors.primary : Colors.error}
            />
            <Text style={[styles.summaryLabel, activeTab === 'expense' && styles.summaryLabelActive]}>
              Chi tiêu
            </Text>
          </View>
          <Text style={styles.summaryValue}>
            {activeTab === 'expense' ? formatCurrency(totalAmount) : '******'}
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
              color={activeTab === 'income' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.summaryLabel, activeTab === 'income' && styles.summaryLabelActive]}>
              Thu nhập
            </Text>
          </View>
          <Text style={styles.summaryValue}>
            {activeTab === 'income' ? formatCurrency(totalAmount) : '******'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        {viewMode === 'pie' ? (
          <View style={styles.pieChartWrapper}>
            <View style={styles.donutContainer}>
              {pieChartData.length > 0 ? (
                <PieChart
                  data={pieChartData as any}
                  donut
                  radius={100}
                  innerRadius={65}
                  innerCircleColor={Colors.white}
                  focusOnPress={true}
                  toggleFocusOnPress={true}
                  centerLabelComponent={() => {
                    const selected = distribution.find(d => d.key === selectedCategoryKey);
                    if (!selected) {
                      return (
                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                          <Text style={{fontSize: 12, color: PASTEL_PALETTE.textMuted, textAlign: 'center'}}>Tổng cộng</Text>
                          <Text style={{fontSize: 16, fontWeight: '800', color: PASTEL_PALETTE.title}}>{formatCurrency(totalAmount)}</Text>
                        </View>
                      );
                    }
                    return (
                      <View style={{justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4}}>
                        <Text style={{fontSize: 22, color: selected.color, fontWeight: '800'}}>{selected.percentage.toFixed(1)}%</Text>
                        <Text style={{fontSize: 12, color: PASTEL_PALETTE.title, textAlign: 'center'}} numberOfLines={1}>{selected.categoryName}</Text>
                      </View>
                    );
                  }}
                />
              ) : (
                <Text style={styles.emptyChartText}>
                  Chưa có dữ liệu danh mục trong kỳ này
                </Text>
              )}
            </View>
            <View style={styles.legendContainer}>
              {distribution.map((item, index) => {
                const isSelected = selectedCategoryKey === item.key;
                return (
                  <TouchableOpacity 
                    key={`${item.key}-${index}`} 
                    style={[styles.legendItem, isSelected && { opacity: 1 }, !isSelected && selectedCategoryKey && { opacity: 0.4 }]}
                    onPress={() => setSelectedCategoryKey(isSelected ? null : item.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.legendIconBox, { backgroundColor: `${item.color}33` }]}>
                      {renderCategoryIcon(item.icon, item.color, 20)}
                    </View>
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={[styles.legendValue, { color: item.color }]}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.lineChartWrapper}>
            {trendData.some((d) => d.value > 0) ? (
              <>
                <View style={styles.lineChartLegend}>
                  {selectedBarIndex !== null ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: PASTEL_PALETTE.title }}>
                        {dateFilter === 'week' ? 'Thứ ' : dateFilter === 'year' ? 'Tháng ' : 'Ngày '} 
                        {trendData[selectedBarIndex].fullLabel}: 
                      </Text>
                      <Text style={{ fontWeight: '800', fontSize: 16, color: trendData[selectedBarIndex].isCurrent ? Colors.primary : trendColor, marginLeft: 4 }}>
                        {formatCurrency(trendData[selectedBarIndex].value)}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={[styles.lineTrendDot, { backgroundColor: trendColor }]} />
                      <Text style={styles.lineChartLegendText}>
                        {trendColor === '#10B981' ? 'Xu hướng tăng' : 'Xu hướng giảm'}
                      </Text>
                    </>
                  )}
                  <Text style={styles.lineChartHint}>{selectedBarIndex !== null ? 'Nhấn lại để hủy' : 'Vuốt ngang để xem'}</Text>
                </View>
                <View style={styles.lineChartPanel}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.lineChartScroll}
                  >
                    <BarChart
                      data={barChartData as any}
                      width={chartWidth}
                      height={220}
                      barWidth={dateFilter === 'month' ? 10 : dateFilter === 'week' ? 22 : 16}
                      spacing={dateFilter === 'month' ? 12 : dateFilter === 'week' ? 22 : 18}
                      initialSpacing={16}
                      endSpacing={16}
                      noOfSections={5}
                      rulesColor="#E2E8F0"
                      rulesType="solid"
                      xAxisThickness={1}
                      xAxisColor="#CBD5E1"
                      yAxisThickness={0}
                      yAxisTextStyle={styles.yAxisLabel}
                      formatYLabel={(label) => {
                        const val = Number(label);
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}Tr`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                        return label;
                      }}
                      roundedTop
                      roundedBottom={false}
                      hideRules={false}
                    />
                  </ScrollView>
                </View>
              </>
            ) : (
              <Text style={styles.emptyChartText}>Chưa có dữ liệu xu hướng trong kỳ này</Text>
            )}
          </View>
        )}
      </View>

      {viewMode === 'pie' && distribution.length > 0 ? (
        <>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>
              Chi tiết từng danh mục ({distribution.length})
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.primary} />
          </View>
          {distribution.map((item, index) => {
            const isSelected = selectedCategoryKey === item.key;
            return (
              <TouchableOpacity 
                key={`${item.key}-${index}`} 
                style={[styles.categoryItem, isSelected && { borderColor: item.color, borderWidth: 2 }]}
                onPress={() => setSelectedCategoryKey(isSelected ? null : item.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}22` }]}>
                  {renderCategoryIcon(item.icon, item.color, 20)}
                </View>
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryItemTitle} numberOfLines={1}>
                    {item.categoryName}
                  </Text>
                  <Text style={styles.categoryItemSubtitle}>
                    {item.percentage.toFixed(1)}% tổng {activeTab === 'expense' ? 'chi' : 'thu'}
                  </Text>
                </View>
                <Text style={styles.categoryAmount}>{formatCurrency(item.totalAmount)}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      ) : null}
    </View>
  );
};

export default NotebookReport;
