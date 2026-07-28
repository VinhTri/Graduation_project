import { StyleSheet } from "react-native";
import Colors from "../../../../shared/constants/Colors";

export const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 8,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.62)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#7C3AED",
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  eyeButton: {
    padding: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#5B21B6",
    marginTop: 6,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statDotMuted: {
    backgroundColor: "#9CA3AF",
  },
  statText: {
    fontSize: 11,
    color: "#6D28D9",
    fontWeight: "700",
    flexShrink: 1,
  },
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    marginHorizontal: 12,
  },
});
export default styles;
