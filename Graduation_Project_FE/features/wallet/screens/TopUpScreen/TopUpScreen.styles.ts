import { StyleSheet, Platform } from "react-native";
import Colors from "../../../../shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  amountSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 10,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
    minWidth: 200,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.black,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: "bold",
    color: Colors.black,
    textAlign: "center",
    padding: 0,
    margin: 0,
    minWidth: 100,
  },
  quickAmountsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  quickAmountChip: {
    width: "31%",
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickAmountChipSelected: {
    backgroundColor: Colors.primary + "1A", // 10% opacity
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
  quickAmountTextSelected: {
    color: Colors.primary,
  },
  paymentSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: Colors.gray,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 100, // fully rounded like premium buttons
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
});
