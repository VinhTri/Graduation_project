import { StyleSheet, Dimensions } from "react-native";
import Colors from "../../../../shared/constants/Colors";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)", // Lớp nền tối trong suốt mờ ảo (Glassmorphism feel)
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  billContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    position: "relative", // Để định vị tuyệt đối các Notch tròn bên mép hóa đơn
    overflow: "hidden",
  },
  
  // Notch cắt tròn ở mép hóa đơn tạo cảm giác vé/hóa đơn thật
  notchLeft: {
    position: "absolute",
    left: -12,
    top: 236, // Vị trí khớp với đường gạch đứt
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.65)", // Trùng màu nền overlay
    zIndex: 10,
  },
  notchRight: {
    position: "absolute",
    right: -12,
    top: 236,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    zIndex: 10,
  },

  // Phần đầu hóa đơn
  billHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  brandName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  amountText: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.text,
  },

  // Đường gạch đứt (Dashed Divider)
  dividerContainer: {
    height: 1,
    width: "100%",
    marginVertical: 22,
    position: "relative",
    justifyContent: "center",
  },
  dashedLine: {
    width: "100%",
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 1,
  },

  // Chi tiết hóa đơn
  detailsContainer: {
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500",
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 2,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "right",
  },
  copyButton: {
    marginLeft: 6,
    padding: 2,
  },

  // Mã vạch giả lập (Barcode) tạo độ chân thực cao cho Bill
  barcodeSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  barcodeContainer: {
    flexDirection: "row",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.75,
  },
  barcodeLine: {
    height: "100%",
    backgroundColor: Colors.black,
    marginHorizontal: 1,
  },
  barcodeText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: 4,
  },

  // Nhãn thông báo sao chép
  toastContainer: {
    position: "absolute",
    bottom: 90,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 99,
  },
  toastText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },

  // Các nút hành động
  actionContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  closeButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
