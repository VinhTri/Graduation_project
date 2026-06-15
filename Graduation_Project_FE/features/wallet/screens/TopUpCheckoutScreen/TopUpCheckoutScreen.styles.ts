import { StyleSheet } from "react-native";
import Colors from "../../../../shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16, 
    paddingBottom: 20,
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
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: Colors.primary + "1A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 8,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  amountSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.black,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 24,
  },
  detailsSection: {
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.black,
  },
  actionsContainer: {
    width: "100%",
    marginTop: 32,
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
});
