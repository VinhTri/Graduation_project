import { StyleSheet, Platform, Dimensions } from "react-native";
import Colors from "../../../../shared/constants/Colors";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Title & Toggle Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    marginLeft: 6,
  },
  toggleTextActive: {
    color: Colors.primary,
  },

  // Date Selector
  dateSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  dateTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 8,
  },

  // Summary Cards
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F0FDFA",
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: Colors.textMuted,
  },
  summaryLabelActive: {
    color: Colors.primary,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },

  // Insight Banner
  insightBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  insightBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  insightText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  insightHighlight: {
    color: Colors.error,
  },

  // Chart Container
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    minHeight: 220,
  },
  chartPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  chartPlaceholderText: {
    marginTop: 10,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  // Category Details
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    marginRight: 6,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  categoryItemSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  // Chart Specific Styles
  donutContainer: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 4,
    borderColor: "#F4F7F9",
    justifyContent: "center",
    alignItems: "center",
  },
  pieChartWrapper: {
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  legendIconBox: {
    padding: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  legendLabel: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  barChartWrapper: {
    width: "100%",
    alignItems: "center",
  },
  yAxisLabelContainer: {
    width: "100%",
    alignItems: "flex-start",
    paddingLeft: 10,
    marginBottom: 10,
  },
  yAxisLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  barChartInner: {
    paddingLeft: 10,
    width: "100%",
    alignItems: "center",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
  },
  
  // Custom Date Picker Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  
  pickerContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    height: 340,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
  },
  pickerHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "31%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 12,
  },
  gridItemActive: {
    backgroundColor: Colors.primary,
  },
  gridItemText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  gridItemTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  gridItemTextDisabled: {
    color: "#CBD5E1",
  },
  
  // Bottom Buttons
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#F1F5F9",
    marginRight: 12,
  },
  clearButtonText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  }
});
