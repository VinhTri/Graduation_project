import { StyleSheet } from "react-native";
import Colors from "../../../../shared/constants/Colors";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  header: {
    paddingBottom: 22,
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValueIn: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.success,
  },
  summaryValueOut: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.error,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  unclassifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#FEF3C7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  unclassifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    marginLeft: 4,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryLight,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  }
});
