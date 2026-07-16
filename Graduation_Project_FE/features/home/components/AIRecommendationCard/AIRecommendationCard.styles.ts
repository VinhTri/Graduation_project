import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
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
  },
  closeBtn: {
    padding: 4,
  },
});
