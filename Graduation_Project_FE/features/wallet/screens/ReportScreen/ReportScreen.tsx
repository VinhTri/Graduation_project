import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Modal, TouchableWithoutFeedback, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PieChart, BarChart } from "react-native-gifted-charts";

import Colors from "../../../../shared/constants/Colors";
import { styles } from "./ReportScreen.styles";
import { reportService, ReportDistributionResponse, ReportTrendResponse } from "../../../../shared/api/services/reportService";

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
  const [trendData, setTrendData] = useState<ReportTrendResponse[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      const type = activeTab === "expense" ? "EXPENSE" : "INCOME";
      const filter = dateFilter.toUpperCase();
      // Format selectedDate to YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];

      if (viewMode === "pie") {
        const data = await reportService.getDistributionReport(type, filter, dateStr);
        setDistributionData(data);
      } else {
        const data = await reportService.getTrendReport(type, filter, dateStr);
        setTrendData(data);
      }
    };
    fetchReport();
  }, [activeTab, dateFilter, selectedDate, viewMode]);

  const pieChartData = React.useMemo(() => {
    if (!distributionData || distributionData.length === 0) return [];
    return distributionData.map(item => ({
      value: item.percentage,
      color: item.color || Colors.primary
    }));
  }, [distributionData]);

  const barChartData = React.useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map(item => ({
      value: item.value,
      label: item.label,
      frontColor: item.isCurrent ? "#1E90FF" : "#CBE4FA",
      labelTextStyle: { color: item.isCurrent ? "#1E90FF" : Colors.text, fontSize: 11, width: 65, textAlign: 'center' }
    }));
  }, [trendData]);

  const totalAmount = React.useMemo(() => {
    if (viewMode === "pie") {
      return distributionData.reduce((sum, item) => sum + Number(item.totalAmount), 0);
    } else {
      return trendData.reduce((sum, item) => sum + Number(item.value), 0);
    }
  }, [distributionData, trendData, viewMode]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "đ";
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Background filler for iOS safe area */}
      <View style={{ backgroundColor: Colors.primary, height: insets.top, position: 'absolute', top: 0, left: 0, right: 0 }} />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Báo cáo</Text>
        </View>

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
              <View style={styles.pieChartWrapper}>
                <View style={styles.donutContainer}>
                  {pieChartData.length > 0 ? (
                    <PieChart
                      data={pieChartData as any}
                      donut
                      radius={100}
                      innerRadius={55}
                      innerCircleColor={Colors.white}
                    />
                  ) : (
                    <Text style={{ color: Colors.textMuted }}>Không có dữ liệu</Text>
                  )}
                </View>

                {/* Dynamic Legend */}
                <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {distributionData.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', width: '45%', marginBottom: 15, marginHorizontal: '2%' }}>
                      <View style={[styles.legendIconBox, { backgroundColor: item.color + '33', padding: 8, borderRadius: 8 }]}>
                         {/* Fallback to text if icon name isn't fully compatible with FontAwesome/Feather */}
                         <Text style={{ fontSize: 14, color: item.color, fontWeight: 'bold' }}>{item.icon ? item.icon.substring(0,2) : "?"}</Text>
                      </View>
                      <View style={{ marginLeft: 8 }}>
                        <Text style={[styles.legendValue, { color: item.color, fontSize: 16 }]}>{item.percentage.toFixed(1)}%</Text>
                        <Text style={[styles.legendLabel, { marginTop: 0, fontSize: 12 }]} numberOfLines={1}>{item.categoryName}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.barChartWrapper}>
                <View style={styles.yAxisLabelContainer}>
                  {/* Label removed since we now use formatYLabel directly on BarChart */}
                </View>
                <View style={styles.barChartInner}>
                  <BarChart
                    data={barChartData as any}
                    barWidth={35}
                    spacing={30}
                    roundedTop
                    hideRules={false}
                    rulesColor="#E5E7EB"
                    rulesType="solid"
                    xAxisThickness={1}
                    xAxisColor="#E5E7EB"
                    yAxisThickness={0}
                    yAxisTextStyle={styles.yAxisLabel}
                    formatYLabel={(label) => {
                      const val = Number(label);
                      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Tr';
                      if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
                      return label;
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Details Section */}
          <TouchableOpacity style={styles.categoryHeader} activeOpacity={0.7}>
            <Text style={styles.categoryTitle}>Chi tiết từng danh mục ({distributionData.length})</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.primary} />
          </TouchableOpacity>

          {distributionData.map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '1A' }]}>
                {/* Fallback to text if icon is just a fallback question mark */}
                <Text style={{ fontSize: 18, color: item.color, fontWeight: 'bold' }}>{item.icon ? item.icon.substring(0,2) : "?"}</Text>
              </View>
              <View style={styles.categoryDetails}>
                <Text style={styles.categoryItemTitle}>{item.categoryName}</Text>
                <Text style={styles.categoryItemSubtitle}>{item.percentage.toFixed(1)}%</Text>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          ))}

        </ScrollView>
      </View>

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


    </View>
  );
}
