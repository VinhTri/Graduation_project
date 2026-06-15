import { StyleSheet } from "react-native";
import Colors from "../../../../shared/constants/Colors";

export const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.15)",
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
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  eyeButton: {
    padding: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.white,
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
    backgroundColor: "#10B981", // Active status green dot
    marginRight: 6,
  },
  statText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "700",
  },
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 12,
  },
  safetyText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.55)",
    fontWeight: "600",
  },
});
export default styles;
