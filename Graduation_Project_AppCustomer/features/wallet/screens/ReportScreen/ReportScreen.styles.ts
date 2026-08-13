import { StyleSheet, Platform, Dimensions } from "react-native";
import Colors from "../../../../shared/constants/Colors";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  header: {
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    color: PASTEL_PALETTE.title,
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
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
    backgroundColor: Colors.primaryLight,
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
    justifyContent: "center",
  },
  distributionTabs: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  distributionTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  distributionTabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  distributionTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  distributionTabTextActive: {
    color: Colors.primary,
  },
  legendContainer: {
    width: "100%",
    paddingHorizontal: 12,
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "46%",
    marginBottom: 15,
    marginHorizontal: "1%",
  },
  pageDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  pageDotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  swipeHint: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
  legendIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
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
  lineChartWrapper: {
    width: "100%",
    alignItems: "stretch",
    minHeight: 260,
  },
  lineChartLegend: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
    flexWrap: "wrap",
    gap: 8,
  },
  lineTrendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineChartLegendText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  lineChartHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: "auto",
  },
  lineChartPanel: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingTop: 8,
    paddingBottom: 12,
  },
  lineChartScroll: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  pointerLabel: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pointerLabelText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  yAxisLabel: {
    color: Colors.textMuted,
    fontSize: 13,
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
  },

  // Unclassified transactions
  unclassifiedSection: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  unclassifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  unclassifiedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
  },
  unclassifiedHint: {
    fontSize: 13,
    color: "#B45309",
    marginBottom: 12,
    lineHeight: 18,
  },
  unclassifiedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  unclassifiedItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  unclassifiedItemSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  classifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  classifyBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
