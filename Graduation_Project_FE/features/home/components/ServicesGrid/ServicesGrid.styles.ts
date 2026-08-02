import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 24,
    padding: 16,
    shadowColor: PASTEL_PALETTE.lavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 12,
    color: PASTEL_PALETTE.title,
    textAlign: "center",
    fontWeight: "500",
  },
});
