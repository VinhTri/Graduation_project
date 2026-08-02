import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: PASTEL_PALETTE.white,
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: -20,
    padding: 14,
    zIndex: 1,
    shadowColor: PASTEL_PALETTE.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  walletsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eyeIcon: {
    marginRight: 12,
  },
  walletItem: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: PASTEL_PALETTE.border,
    paddingHorizontal: 8,
  },
  walletItemNoBorder: {
    borderRightWidth: 0,
  },
  smartSpendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: "500",
  },
  smartSpendLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  brandSmart: {
    color: PASTEL_PALETTE.title,
  },
  brandSpend: {
    color: PASTEL_PALETTE.accent,
  },
  walletBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: "700",
    color: PASTEL_PALETTE.title,
    marginRight: 4,
  },
  financialCenterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  financialCenterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  financialCenterText: {
    color: PASTEL_PALETTE.subtitle,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
