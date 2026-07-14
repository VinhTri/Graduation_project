import { StyleSheet } from "react-native";
import Colors from "../../../../shared/constants/Colors";

export const styles = StyleSheet.create({
  linkCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    marginTop: 16,
    marginBottom: 8, // Added gap below to space out from the wallet stack
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  linkCardText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: 8,
  },
});
export default styles;
