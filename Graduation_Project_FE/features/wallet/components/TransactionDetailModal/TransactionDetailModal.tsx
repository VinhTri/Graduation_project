import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  Platform
} from "react-native";
import * as ReactNative from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./TransactionDetailModal.styles";

// Safe dynamic lookup for Clipboard to support newer React Native versions without TS compile errors
const NativeClipboard = (ReactNative as any).Clipboard;

export interface Transaction {
  id: string;
  title: string;
  type: string; // topup, withdraw, payment
  amount: number;
  date: string;
  status: string; // success, pending, failed
  icon: string;
  category?: string;
  notes?: string;
}

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailModal({
  visible,
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!transaction) return null;

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString("vi-VN") + " ₫";
    return isNegative ? `-${formatted}` : `+${formatted}`;
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "success":
        return {
          text: "Giao dịch thành công",
          color: Colors.success,
          icon: "checkmark-circle" as const,
          bgColor: Colors.success + "15", // 8% opacity
        };
      case "pending":
        return {
          text: "Đang xử lý",
          color: Colors.warning,
          icon: "time" as const,
          bgColor: Colors.warning + "15",
        };
      case "failed":
        return {
          text: "Giao dịch thất bại",
          color: Colors.error,
          icon: "close-circle" as const,
          bgColor: Colors.error + "15",
        };
      default:
        return {
          text: "Không xác định",
          color: Colors.textMuted,
          icon: "help-circle" as const,
          bgColor: Colors.border + "15",
        };
    }
  };

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case "topup":
        return "Nạp tiền vào ví";
      case "withdraw":
        return "Rút tiền về ngân hàng";
      case "payment":
        return "Thanh toán dịch vụ";
      default:
        return "Giao dịch khác";
    }
  };

  const getSourceOfFund = (type: string) => {
    switch (type) {
      case "topup":
        return "Tài khoản liên kết (Vietcombank)";
      case "withdraw":
        return "Số dư ví SmartWallet";
      case "payment":
        return "Số dư ví SmartWallet";
      default:
        return "Số dư ví SmartWallet";
    }
  };

  const statusInfo = getStatusDetails(transaction.status);
  const isPositive = transaction.amount > 0;

  const handleCopyTxId = () => {
    try {
      if (NativeClipboard && typeof NativeClipboard.setString === "function") {
        NativeClipboard.setString(transaction.id);
        setToastMessage("Đã sao chép mã giao dịch!");
      } else {
        Alert.alert("Thông tin", `Mã giao dịch: ${transaction.id}`);
      }
    } catch (e) {
      Alert.alert("Thông tin", `Mã giao dịch: ${transaction.id}`);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `🧾 HÓA ĐƠN GIAO DỊCH SMARTWALLET\n` +
        `---------------------------------\n` +
        `• Giao dịch: ${transaction.title}\n` +
        (transaction.category ? `• Danh mục: ${transaction.category}\n` : "") +
        `• Số tiền: ${formatCurrency(transaction.amount)}\n` +
        `• Mã GD: ${transaction.id}\n` +
        `• Thời gian: ${transaction.date}\n` +
        `• Trạng thái: ${statusInfo.text}\n` +
        `• Nguồn tiền: ${getSourceOfFund(transaction.type)}\n` +
        `• Ghi chú: ${transaction.notes || transaction.title}\n` +
        `---------------------------------\n` +
        `Cảm ơn quý khách đã tin dùng SmartWallet!`;

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error("Lỗi khi chia sẻ hóa đơn:", error);
    }
  };

  const handleSaveBill = () => {
    // Mô phỏng lưu ảnh thành công
    setToastMessage("Đã lưu hóa đơn vào Thư viện ảnh!");
  };

  // Tạo mảng chiều rộng cho các nét của mã vạch giả lập (barcode)
  const barcodeLines = [
    2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Bill Container */}
        <TouchableOpacity
          style={styles.billContainer}
          activeOpacity={1}
          onPress={() => {}} // Ngăn đóng modal khi bấm vào bên trong hóa đơn
        >
          {/* Notches */}
          <View style={styles.notchLeft} />
          <View style={styles.notchRight} />

          {/* Bill Header */}
          <View style={styles.billHeader}>
            <View style={[styles.logoContainer, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="wallet" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.brandName}>SmartWallet</Text>
            
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>

            <Text
              style={[
                styles.amountText,
                { color: isPositive ? Colors.success : Colors.text }
              ]}
            >
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          {/* Dashed Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dashedLine} />
          </View>

          {/* Bill Details */}
          <View style={styles.detailsContainer}>
            {/* Loại giao dịch */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Loại giao dịch</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>
                  {getTransactionTypeName(transaction.type)}
                </Text>
              </View>
            </View>

            {/* Mã giao dịch */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã giao dịch</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{transaction.id}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyTxId}
                  activeOpacity={0.6}
                >
                  <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Thời gian */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thời gian</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{transaction.date}</Text>
              </View>
            </View>

            {/* Nguồn tiền */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nguồn tiền</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>
                  {getSourceOfFund(transaction.type)}
                </Text>
              </View>
            </View>

            {/* Phí giao dịch */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phí giao dịch</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, { color: Colors.success }]}>Miễn phí</Text>
              </View>
            </View>

            {/* Danh mục */}
            {transaction.category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Danh mục</Text>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>{transaction.category}</Text>
                </View>
              </View>
            )}

            {/* Ghi chú */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ghi chú</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue} numberOfLines={3}>
                  {transaction.notes || transaction.title}
                </Text>
              </View>
            </View>
          </View>

          {/* Barcode Section */}
          <View style={styles.barcodeSection}>
            <View style={styles.barcodeContainer}>
              {barcodeLines.map((lineWidth, idx) => (
                <View
                  key={idx}
                  style={[styles.barcodeLine, { width: lineWidth }]}
                />
              ))}
            </View>
            <Text style={styles.barcodeText}>{transaction.id.toUpperCase()}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.text} />
              <Text style={styles.secondaryButtonText}>Chia sẻ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSaveBill}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Lưu bill</Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Custom Toast Alert */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );
}
