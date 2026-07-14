import { StyleSheet } from "react-native";
import Colors from "@/shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    marginBottom: 40, // Space before the end of scroll
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%", // Two columns
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    // No shadow here to keep it clean, or very subtle shadow
  },
  imageCover: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: Colors.border,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 18,
  },

});
