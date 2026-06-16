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
  imagePlaceholder: {
    height: 100,
    padding: 12,
    justifyContent: "flex-start",
  },
  imageOverlayText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  imageOverlaySubtext: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "500",
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
  cardAction: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
});
