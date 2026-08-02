import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Modal, TouchableWithoutFeedback, Platform, Alert, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { PieChart, LineChart } from "react-native-gifted-charts";

import Colors from "../../../../shared/constants/Colors";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";
import { PastelHeaderShell } from "../../../../shared/components/PastelHeaderShell";
import { styles } from "./ReportScreen.styles";
import { reportService, ReportDistributionResponse, ReportTrendResponse } from "../../../../shared/api/services/reportService";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { CategorySelectModal } from "../../../categories/components/CategorySelectModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PIE_PAGE_WIDTH = SCREEN_WIDTH - 40;

const renderCategoryIcon = (iconName: string | undefined, color: string, size: number) => (
  <Ionicons
    name={(iconName && iconName !== "?" ? iconName : "help-circle-outline") as keyof typeof Ionicons.glyphMap}
    size={size}
    color={color}
  />
);

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // States for toggles
  const [viewMode, setViewMode] = useState<"pie" | "bar">("pie");
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [dateFilter, setDateFilter] = useState<"week" | "month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempFilter, setTempFilter] = useState<"week" | "month" | "year">("month");
  const [tempDate, setTempDate] = useState(new Date());

  const openDateModal = () => {
    setTempFilter(dateFilter);
    setTempDate(new Date(selectedDate.getTime()));
    setIsDateModalVisible(true);
  };

  const applyDateModal = () => {
    setDateFilter(tempFilter);
    setSelectedDate(new Date(tempDate.getTime()));
    setIsDateModalVisible(false);
  };

  const getDateLabel = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    if (dateFilter === "week") {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1)); // Handle Sunday = 0
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}`;
    } else if (dateFilter === "month") {
      if (selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear) return "Tháng này";
      return `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
    } else if (dateFilter === "year") {
      if (selectedDate.getFullYear() === currentYear) return "Năm nay";
      return `Năm ${selectedDate.getFullYear()}`;
    }
  };

  const renderPickerGrid = () => {
    const currentDate = new Date();

    if (tempFilter === "month") {
      const months = Array.from({length: 12}, (_, i) => i);
      return (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.setFullYear(tempDate.getFullYear() - 1)))}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.pickerHeaderText}>Năm {tempDate.getFullYear()}</Text>
            <TouchableOpacity 
              onPress={() => setTempDate(new Date(tempDate.setFullYear(tempDate.getFullYear() + 1)))}
              disabled={tempDate.getFullYear() >= currentDate.getFullYear()}
            >
              <Ionicons name="chevron-forward" size={20} color={tempDate.getFullYear() >= currentDate.getFullYear() ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.gridContainer}>
            {months.map(m => {
              const isFuture = tempDate.getFullYear() > currentDate.getFullYear() || (tempDate.getFullYear() === currentDate.getFullYear() && m > currentDate.getMonth());
              return (
                <TouchableOpacity 
                  key={m} 
                  style={[styles.gridItem, tempDate.getMonth() === m && !isFuture && styles.gridItemActive]}
                  onPress={() => !isFuture && setTempDate(new Date(tempDate.setMonth(m)))}
                  disabled={isFuture}
                >
                  <Text style={[styles.gridItemText, tempDate.getMonth() === m && !isFuture && styles.gridItemTextActive, isFuture && styles.gridItemTextDisabled]}>
                    Tháng {m + 1}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      );
    } else if (tempFilter === "year") {
      const startYear = Math.floor(tempDate.getFullYear() / 12) * 12;
      const years = Array.from({length: 12}, (_, i) => startYear + i);
      return (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.setFullYear(tempDate.getFullYear() - 12)))}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.pickerHeaderText}>{startYear} - {startYear + 11}</Text>
            <TouchableOpacity 
              onPress={() => setTempDate(new Date(tempDate.setFullYear(tempDate.getFullYear() + 12)))}
              disabled={startYear + 11 >= currentDate.getFullYear()}
            >
              <Ionicons name="chevron-forward" size={20} color={startYear + 11 >= currentDate.getFullYear() ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.gridContainer}>
            {years.map(y => {
              const isFuture = y > currentDate.getFullYear();
              return (
                <TouchableOpacity 
                  key={y} 
                  style={[styles.gridItem, tempDate.getFullYear() === y && !isFuture && styles.gridItemActive]}
                  onPress={() => !isFuture && setTempDate(new Date(tempDate.setFullYear(y)))}
                  disabled={isFuture}
                >
                  <Text style={[styles.gridItemText, tempDate.getFullYear() === y && !isFuture && styles.gridItemTextActive, isFuture && styles.gridItemTextDisabled]}>
                    Năm {y}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      );
    } else if (tempFilter === "week") {
      const weeks = [1, 2, 3, 4, 5];
      return (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setTempDate(new Date(tempDate.setMonth(tempDate.getMonth() - 1)))}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.pickerHeaderText}>Tháng {tempDate.getMonth() + 1} Năm {tempDate.getFullYear()}</Text>
            <TouchableOpacity 
              onPress={() => setTempDate(new Date(tempDate.setMonth(tempDate.getMonth() + 1)))}
              disabled={tempDate.getFullYear() > currentDate.getFullYear() || (tempDate.getFullYear() === currentDate.getFullYear() && tempDate.getMonth() >= currentDate.getMonth())}
            >
              <Ionicons name="chevron-forward" size={20} color={tempDate.getFullYear() > currentDate.getFullYear() || (tempDate.getFullYear() === currentDate.getFullYear() && tempDate.getMonth() >= currentDate.getMonth()) ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, width: "100%" }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "column", gap: 10, paddingBottom: 10 }}>
            {weeks.map(w => {
              const startDay = (w - 1) * 7 + 1;
              const startDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), startDay);
              
              if (startDate.getMonth() !== tempDate.getMonth() && w === 5) return null;
              
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + 6);
              if (endDate.getMonth() !== tempDate.getMonth()) {
                 endDate.setMonth(tempDate.getMonth() + 1);
                 endDate.setDate(0);
              }
              
              const isSelected = tempDate.getDate() >= startDate.getDate() && tempDate.getDate() <= endDate.getDate();
              // Disable if the start of this week is strictly after the current date
              const isFuture = startDate > currentDate;
              
              return (
                <TouchableOpacity 
                  key={w} 
                  style={[styles.gridItem, isSelected && !isFuture && styles.gridItemActive, { width: "100%", marginBottom: 0 }]}
                  onPress={() => !isFuture && setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), startDay))}
                  disabled={isFuture}
                >
                  <Text style={[styles.gridItemText, isSelected && !isFuture && styles.gridItemTextActive, isFuture && styles.gridItemTextDisabled]}>
                    Tuần {w}: {startDate.getDate()}/{startDate.getMonth() + 1} - {endDate.getDate()}/{endDate.getMonth() + 1}
                  </Text>
                </TouchableOpacity>
              )
            })}
            </View>
          </ScrollView>
        </View>
      );
    }
  };

  const [distributionData, setDistributionData] = useState<ReportDistributionResponse[]>([]);
  const [groupDistributionData, setGroupDistributionData] = useState<ReportDistributionResponse[]>([]);
  const [distributionPage, setDistributionPage] = useState(0);
  const distributionPagerRef = useRef<ScrollView>(null);
  const [trendData, setTrendData] = useState<ReportTrendResponse[]>([]);
  const [unclassified, setUnclassified] = useState<any[]>([]);
  const [classifyingCode, setClassifyingCode] = useState<string | null>(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Khoảng thời gian khớp với backend (Tuần: T2-CN, Tháng: đầu-cuối tháng, Năm: cả năm).
  const getRange = useCallback(() => {
    const d = new Date(selectedDate);
    let start: Date, end: Date;
    if (dateFilter === "week") {
      start = new Date(d);
      const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (dateFilter === "year") {
      start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
  }, [dateFilter, selectedDate]);

  const loadData = useCallback(async () => {
    const type = activeTab === "expense" ? "EXPENSE" : "INCOME";
    const filter = dateFilter.toUpperCase();
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (viewMode === "pie") {
      const [data, groupData] = await Promise.all([
        reportService.getDistributionReport(type as any, filter, dateStr),
        reportService.getGroupDistributionReport(type as any, filter, dateStr),
      ]);
      setDistributionData(data);
      setGroupDistributionData(groupData);
    } else {
      const data = await reportService.getTrendReport(type as any, filter, dateStr);
      setTrendData(data);
    }

    // Giao dịch rút tiền chưa phân loại trong kỳ (chỉ tab Chi tiêu).
    if (activeTab !== "expense") {
      setUnclassified([]);
      return;
    }
    try {
      const history = await transactionService.getTransactionHistory();
      const { start, end } = getRange();
      const pending = (history || []).filter((t: any) => {
        if (t?.type !== "WITHDRAW") return false;
        if (t?.categoryId) return false;
        if (String(t?.status).toUpperCase() !== "SUCCESS") return false;
        const created = new Date(t.createdAt);
        return created >= start && created <= end;
      });
      setUnclassified(pending);
    } catch {
      setUnclassified([]);
    }
  }, [activeTab, dateFilter, selectedDate, viewMode, getRange]);

  useEffect(() => {
    setDistributionPage(0);
    distributionPagerRef.current?.scrollTo({ x: 0, animated: false });
  }, [activeTab, dateFilter, selectedDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openClassify = (code: string) => {
    setClassifyingCode(code);
    setIsCategoryModalVisible(true);
  };

  const handleSelectCategory = async (category: any) => {
    const code = classifyingCode;
    setIsCategoryModalVisible(false);
    if (!code) return;
    setIsSaving(true);
    try {
      await transactionService.updateTransaction(code, { categoryId: Number(category.id) });
      await loadData();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể phân loại giao dịch");
    } finally {
      setIsSaving(false);
      setClassifyingCode(null);
    }
  };

  const pieChartData = React.useMemo(() => {
    if (!distributionData || distributionData.length === 0) return [];
    return distributionData.map(item => ({
      value: item.percentage,
      color: item.color || Colors.primary
    }));
  }, [distributionData]);

  const groupPieChartData = React.useMemo(() => {
    if (!groupDistributionData || groupDistributionData.length === 0) return [];
    return groupDistributionData.map(item => ({
      value: item.percentage,
      color: item.color || Colors.primary
    }));
  }, [groupDistributionData]);

  const activeDistributionData = distributionPage === 0 ? distributionData : groupDistributionData;

  const lineChartData = React.useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map(item => ({
      value: Number(item.value),
      label: item.label,
      labelTextStyle: {
        color: item.isCurrent ? "#2563EB" : Colors.textMuted,
        fontSize: 10,
        width: 36,
        textAlign: "center" as const,
      },
    }));
  }, [trendData]);

  const lineTrendColor = React.useMemo(() => {
    if (lineChartData.length < 2) return "#2563EB";
    const firstVal = lineChartData.find((d) => d.value > 0)?.value ?? lineChartData[0].value;
    const lastVal = lineChartData[lineChartData.length - 1]?.value ?? 0;
    return lastVal >= firstVal ? "#10B981" : "#EF4444";
  }, [lineChartData]);

  const lineChartWidth = React.useMemo(() => {
    const pointSpacing = dateFilter === "month" ? 24 : dateFilter === "week" ? 48 : 36;
    return Math.max(SCREEN_WIDTH - 56, lineChartData.length * pointSpacing + 48);
  }, [lineChartData.length, dateFilter]);

  const totalAmount = React.useMemo(() => {
    if (viewMode === "pie") {
      return activeDistributionData.reduce((sum, item) => sum + Number(item.totalAmount), 0);
    } else {
      return trendData.reduce((sum, item) => sum + Number(item.value), 0);
    }
  }, [activeDistributionData, trendData, viewMode]);

  const handleDistributionScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / PIE_PAGE_WIDTH);
    if (page !== distributionPage) {
      setDistributionPage(page);
    }
  };

  const renderPieDistributionPage = (
    data: ReportDistributionResponse[],
    pieData: { value: number; color: string }[],
    emptyMessage: string
  ) => (
    <View style={[styles.pieChartWrapper, { width: PIE_PAGE_WIDTH }]}>
      <View style={styles.donutContainer}>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData as any}
            donut
            radius={100}
            innerRadius={55}
            innerCircleColor={Colors.white}
          />
        ) : (
          <Text style={{ color: Colors.textMuted, textAlign: "center", paddingHorizontal: 24 }}>
            {emptyMessage}
          </Text>
        )}
      </View>

      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={`${item.categoryId}-${index}`} style={styles.legendItem}>
            <View style={[styles.legendIconBox, { backgroundColor: item.color + '33' }]}>
              {renderCategoryIcon(item.icon, item.color, 20)}
            </View>
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={[styles.legendValue, { color: item.color, fontSize: 16 }]}>
                {item.percentage.toFixed(1)}%
              </Text>
              <Text style={[styles.legendLabel, { marginTop: 0, fontSize: 12 }]} numberOfLines={1}>
                {item.categoryName}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <PastelHeaderShell contentStyle={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back-outline" size={22} color={PASTEL_PALETTE.subtitle} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            Báo cáo
          </Text>
        </View>
      </PastelHeaderShell>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tình hình thu chi</Text>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, viewMode === "pie" && styles.toggleButtonActive]}
                onPress={() => setViewMode("pie")}
              >
                <Ionicons name="pie-chart" size={16} color={viewMode === "pie" ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.toggleText, viewMode === "pie" && styles.toggleTextActive]}>Phân bổ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toggleButton, viewMode === "bar" && styles.toggleButtonActive]}
                onPress={() => setViewMode("bar")}
              >
                <Ionicons name="bar-chart" size={16} color={viewMode === "bar" ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.toggleText, viewMode === "bar" && styles.toggleTextActive]}>Xu hướng</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity 
              style={styles.dateTextContainer}
              onPress={openDateModal}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.text} />
              <Text style={styles.dateText}>{getDateLabel()}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            {/* Expense Card */}
            <TouchableOpacity 
              style={[styles.summaryCard, activeTab === "expense" && styles.summaryCardActive]}
              onPress={() => setActiveTab("expense")}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLabelRow}>
                <Feather name="trending-up" size={16} color={activeTab === "expense" ? Colors.primary : Colors.error} />
                <Text style={[styles.summaryLabel, activeTab === "expense" && styles.summaryLabelActive]}>Chi tiêu</Text>
              </View>
              <Text style={styles.summaryValue}>{activeTab === "expense" ? formatCurrency(totalAmount) : "******"}</Text>
            </TouchableOpacity>

            {/* Income Card */}
            <TouchableOpacity 
              style={[styles.summaryCard, activeTab === "income" && styles.summaryCardActive]}
              onPress={() => setActiveTab("income")}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLabelRow}>
                <Feather name="trending-down" size={16} color={activeTab === "income" ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.summaryLabel, activeTab === "income" && styles.summaryLabelActive]}>Thu nhập</Text>
              </View>
              <Text style={styles.summaryValue}>{activeTab === "income" ? formatCurrency(totalAmount) : "******"}</Text>
            </TouchableOpacity>
          </View>

          {/* Charts Area */}
          <View style={styles.chartContainer}>
            {viewMode === "pie" ? (
              <>
                <View style={styles.distributionTabs}>
                  <TouchableOpacity
                    style={[styles.distributionTab, distributionPage === 0 && styles.distributionTabActive]}
                    onPress={() => {
                      setDistributionPage(0);
                      distributionPagerRef.current?.scrollTo({ x: 0, animated: true });
                    }}
                  >
                    <Text style={[styles.distributionTabText, distributionPage === 0 && styles.distributionTabTextActive]}>
                      Danh mục
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.distributionTab, distributionPage === 1 && styles.distributionTabActive]}
                    onPress={() => {
                      setDistributionPage(1);
                      distributionPagerRef.current?.scrollTo({ x: PIE_PAGE_WIDTH, animated: true });
                    }}
                  >
                    <Text style={[styles.distributionTabText, distributionPage === 1 && styles.distributionTabTextActive]}>
                      Nhóm
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  ref={distributionPagerRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleDistributionScroll}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                >
                  {renderPieDistributionPage(
                    distributionData,
                    pieChartData,
                    unclassified.length > 0
                      ? "Phân loại các giao dịch bên dưới để xem biểu đồ nhé!"
                      : "Chưa có dữ liệu danh mục trong kỳ này"
                  )}
                  {renderPieDistributionPage(
                    groupDistributionData,
                    groupPieChartData,
                    "Chưa có dữ liệu nhóm trong kỳ này"
                  )}
                </ScrollView>

                <View style={styles.pageDots}>
                  <View style={[styles.pageDot, distributionPage === 0 && styles.pageDotActive]} />
                  <View style={[styles.pageDot, distributionPage === 1 && styles.pageDotActive]} />
                </View>
                <Text style={styles.swipeHint}>Vuốt sang trái để xem phân tích theo nhóm</Text>
              </>
            ) : (
              <View style={styles.lineChartWrapper}>
                {lineChartData.length > 0 ? (
                  <>
                    <View style={styles.lineChartLegend}>
                      <View style={[styles.lineTrendDot, { backgroundColor: lineTrendColor }]} />
                      <Text style={styles.lineChartLegendText}>
                        {lineTrendColor === "#10B981" ? "Xu hướng tăng" : "Xu hướng giảm"}
                      </Text>
                      <Text style={styles.lineChartHint}>Chạm vào biểu đồ để xem giá trị</Text>
                    </View>
                    <View style={styles.lineChartPanel}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineChartScroll}>
                        <LineChart
                          data={lineChartData as any}
                          width={lineChartWidth}
                          height={200}
                          overflowTop={44}
                          curved={false}
                          color={lineTrendColor}
                          thickness={2.5}
                          spacing={dateFilter === "month" ? 22 : dateFilter === "week" ? 44 : 34}
                          initialSpacing={20}
                          endSpacing={20}
                          hideDataPoints
                          noOfSections={5}
                          hideRules={false}
                          rulesColor="#E2E8F0"
                          rulesType="solid"
                          xAxisThickness={1}
                          xAxisColor="#CBD5E1"
                          yAxisThickness={0}
                          yAxisTextStyle={styles.yAxisLabel}
                          formatYLabel={(label) => {
                            const val = Number(label);
                            if (val >= 1000000) return (val / 1000000).toFixed(1) + "Tr";
                            if (val >= 1000) return (val / 1000).toFixed(0) + "K";
                            return label;
                          }}
                          pointerConfig={{
                            pointerStripUptoDataPoint: true,
                            pointerStripHeight: 160,
                            pointerStripColor: lineTrendColor + "55",
                            pointerStripWidth: 1,
                            pointerColor: lineTrendColor,
                            radius: 5,
                            pointerLabelWidth: 120,
                            pointerLabelHeight: 40,
                            shiftPointerLabelY: 16,
                            autoAdjustPointerLabelPosition: true,
                            activatePointersOnLongPress: false,
                            activatePointersInstantlyOnTouch: true,
                            persistPointer: false,
                            pointerLabelComponent: (items: any) => {
                              const val = items?.[0]?.value ?? 0;
                              return (
                                <View style={[styles.pointerLabel, { borderColor: lineTrendColor }]}>
                                  <Text style={[styles.pointerLabelText, { color: lineTrendColor }]} numberOfLines={1}>
                                    {formatCurrency(val)}
                                  </Text>
                                </View>
                              );
                            },
                          }}
                        />
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  <Text style={{ color: Colors.textMuted, textAlign: "center", paddingHorizontal: 24 }}>
                    Chưa có dữ liệu xu hướng trong kỳ này
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Giao dịch chưa phân loại — phân loại trực tiếp trong báo cáo (tab Chi tiêu) */}
          {activeTab === "expense" && unclassified.length > 0 && (
            <View style={styles.unclassifiedSection}>
              <View style={styles.unclassifiedHeader}>
                <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                <Text style={styles.unclassifiedTitle}>Chưa phân loại ({unclassified.length})</Text>
              </View>
              <Text style={styles.unclassifiedHint}>Gắn danh mục để đưa các giao dịch này vào biểu đồ phân tích nhé!</Text>
              {unclassified.map((t) => (
                <View key={t.transactionCode} style={styles.unclassifiedItem}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.unclassifiedItemTitle} numberOfLines={1}>
                      {t.note || "Rút tiền về ngân hàng"}
                    </Text>
                    <Text style={styles.unclassifiedItemSub}>{formatCurrency(Number(t.amount))}</Text>
                  </View>
                  <TouchableOpacity style={styles.classifyBtn} onPress={() => openClassify(t.transactionCode)} activeOpacity={0.8}>
                    <Ionicons name="pricetag-outline" size={14} color={Colors.white} />
                    <Text style={styles.classifyBtnText}>Phân loại</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {viewMode === "pie" && (
            <>
              <TouchableOpacity style={styles.categoryHeader} activeOpacity={0.7}>
                <Text style={styles.categoryTitle}>
                  {distributionPage === 0
                    ? `Chi tiết từng danh mục (${distributionData.length})`
                    : `Chi tiết từng nhóm (${groupDistributionData.length})`}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.primary} />
              </TouchableOpacity>

              {activeDistributionData.map((item, index) => (
                <View key={`${distributionPage}-${item.categoryId}-${index}`} style={styles.categoryItem}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '1A' }]}>
                    {renderCategoryIcon(item.icon, item.color, 22)}
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryItemTitle}>{item.categoryName}</Text>
                    <Text style={styles.categoryItemSubtitle}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(item.totalAmount)}</Text>
                </View>
              ))}
            </>
          )}

        </ScrollView>

      {/* Date Filter Modal */}
      <Modal
        visible={isDateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDateModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDateModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn thời gian hiển thị chi tiêu</Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsDateModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                  {(["week", "month", "year"] as const).map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.tabButton, tempFilter === filter && styles.tabButtonActive]}
                      onPress={() => setTempFilter(filter)}
                    >
                      <Text style={[styles.tabText, tempFilter === filter && styles.tabTextActive]}>
                        {filter === "week" ? "Tuần" : filter === "month" ? "Tháng" : "Năm"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Grid */}
                {renderPickerGrid()}

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.clearButton]}
                    onPress={() => {
                      setTempDate(new Date());
                      setTempFilter("month");
                    }}
                  >
                    <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.applyButton]}
                    onPress={applyDateModal}
                  >
                    <Text style={styles.applyButtonText}>Áp dụng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Chọn danh mục để phân loại nhanh */}
      <CategorySelectModal
        visible={isCategoryModalVisible}
        onClose={() => { setIsCategoryModalVisible(false); setClassifyingCode(null); }}
        onSelect={(item) => handleSelectCategory(item)}
      />

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      )}

    </View>
  );
}
