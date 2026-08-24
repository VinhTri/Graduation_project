import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  robot: {
    width: 72,
    height: 72,
    marginRight: 4,
  },
  contentContainer: {
    flex: 1,
    marginRight: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: PASTEL_PALETTE.title,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: PASTEL_PALETTE.subtitle,
    lineHeight: 18,
    minHeight: 54,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
  },
  cursor: {
    color: PASTEL_PALETTE.accentDeep,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
});
