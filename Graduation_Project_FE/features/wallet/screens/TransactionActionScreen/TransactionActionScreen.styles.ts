import { StyleSheet, Platform } from "react-native";
import Colors from "../../../../shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Light pinkish-gray background like MoMo
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerRight: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  // Folder Tab Styles
  folderTabContainer: {
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 16,
    zIndex: 3,
    elevation: 3, // Needs to be higher than cardContainer (2) to overlap on Android
  },
  folderTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "transparent",
  },
  folderTabActive: {
    backgroundColor: Colors.white,
    borderColor: "#E5E7EB",
    borderBottomColor: Colors.white,
    marginBottom: -1, // Pull down to overlap card top border
  },
  folderTabInactive: {
    backgroundColor: "transparent",
    borderBottomColor: "#E5E7EB",
    opacity: 0.5, // Make the inactive tab faded
  },
  cardTopLeftSquare: {
    borderTopLeftRadius: 0,
  },
  cardTopRightSquare: {
    borderTopRightRadius: 0,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  // Form Content
  formContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  // Wallet Cards
  walletGroupContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    backgroundColor: Colors.white,
  },
  walletCardScroll: {
    marginHorizontal: -16,
    paddingBottom: 16,
  },
  walletCardContent: {
    paddingHorizontal: 16,
  },
  walletCard: {
    minWidth: 160,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 12,
    padding: 12,
    paddingRight: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  walletCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  walletIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 13,
    color: "#6B7280",
  },
  walletBadge: {
    position: "absolute",
    top: -8,
    right: 12,
    backgroundColor: Colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walletBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  // Amount Input
  amountContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    padding: 0,
    margin: 0,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 4,
    marginLeft: 4,
  },
  suggestionContainer: {
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  suggestionText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  // Banner
  bannerContainer: {
    backgroundColor: "#F0FDFA",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  // Source Selection (Radio)
  sourceContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sourceOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sourceOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  sourceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  sourceSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  // Security Info
  securityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  securityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  securityInfo: {
    flex: 1,
  },
  securityText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 4,
  },
  securityLink: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  confirmButtonTextDisabled: {
    color: "#9CA3AF",
  },
  // Modal / Inputs
  noteInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    height: 80,
  },
  noteInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1F2937",
    paddingTop: 0,
    textAlignVertical: "top",
  },
});
