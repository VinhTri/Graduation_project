import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PASTEL_PALETTE.border,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: PASTEL_PALETTE.accentDeep,
  },
});
