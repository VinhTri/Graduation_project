import { StyleSheet } from "react-native";
import Colors from "@/shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for Bottom Tab
  },
  // Section layout
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  aiBubble: {
    position: "absolute",
    bottom: 120,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
});
