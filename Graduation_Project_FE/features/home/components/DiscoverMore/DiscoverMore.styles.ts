import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: PASTEL_PALETTE.title,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  imageCover: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: PASTEL_PALETTE.border,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 13,
    color: PASTEL_PALETTE.title,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 18,
  },
});
