import { StyleSheet } from "react-native";
import Colors from "@/shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF9C3", // Light yellow background
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FEF08A",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF08A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#854D0E",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#A16207",
    lineHeight: 20,
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
    alignSelf: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#FEF08A",
    paddingTop: 12,
  },
  timerText: {
    fontSize: 13,
    color: "#B45309",
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF08A",
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    color: "#854D0E",
    fontWeight: "600",
  }
});
