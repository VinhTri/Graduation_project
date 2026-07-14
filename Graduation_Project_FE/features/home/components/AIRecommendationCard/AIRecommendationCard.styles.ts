import { StyleSheet } from "react-native";
import Colors from "@/shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF08A", // Yellow background
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FDE047", // Darker yellow for icon bg
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
    color: "#854D0E", // Dark yellow/brown text
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: "#A16207",
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
