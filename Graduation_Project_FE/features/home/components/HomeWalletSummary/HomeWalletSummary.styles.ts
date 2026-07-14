import { StyleSheet } from "react-native";
import Colors from "@/shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: -30, // Overlap the teal header
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  walletsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  eyeIcon: {
    marginRight: 12,
  },
  walletItem: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingHorizontal: 8,
  },
  walletItemNoBorder: {
    borderRightWidth: 0,
  },
  walletLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: "500",
  },
  smartSpendLabel: {
    color: Colors.primary, // Teal
    fontWeight: "700",
  },
  walletBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 4,
  },
  financialCenterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0F9FF", // Light blue
    borderRadius: 12,
    padding: 12,
  },
  financialCenterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  financialCenterText: {
    color: "#0284C7", // Blue text
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
