import { StyleSheet } from "react-native";
import Colors from "@/shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 8,
  },
  itemsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  proposalItem: {
    alignItems: "center",
    width: "22%",
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
});
