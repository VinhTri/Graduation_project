import { StyleSheet } from "react-native";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";

export const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  openAccountBtn: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: PASTEL_PALETTE.accent,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  openAccountText: {
    color: PASTEL_PALETTE.white,
    fontSize: 12,
    fontWeight: "800",
  },
  backButton: {
    marginRight: 6,
    marginLeft: -8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: PASTEL_PALETTE.title,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PASTEL_PALETTE.subtitle,
    fontWeight: "600",
    marginTop: 4,
    opacity: 0.85,
  },
});
export default styles;
