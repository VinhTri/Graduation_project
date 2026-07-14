import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  ActivityIndicator
} from "react-native";
import * as ReactNative from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./TransactionDetailModal.styles";
import { CategorySelectModal } from "../../../categories/components/CategorySelectModal";
import { AddCategoryModal } from "../../../categories/components/AddCategoryModal";
import { transactionService } from "../../../../shared/api/services/transactionService";

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
  onRefresh?: () => void;
}

export default function TransactionDetailModal({
  visible,
  transaction,
  onClose,
  onRefresh,
}: TransactionDetailModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [editedNote, setEditedNote] = useState<string>("");
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setEditedNote(transaction.notes || "");
      if (transaction.categoryId) {
        setSelectedCategory({ id: transaction.categoryId, label: transaction.category });
      } else {
        setSelectedCategory(null);
      }
    }
  }, [transaction]);

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
    return "Ví";
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

  const handleSaveChanges = async () => {
    if (!transaction) return;
    setSaving(true);
    try {
      await transactionService.updateTransaction(transaction.id, {
        categoryId: selectedCategory ? Number(selectedCategory.id) : undefined,
        note: editedNote,
      });
      Alert.alert("Thành công", "Cập nhật thông tin giao dịch thành công!");
      if (onRefresh) {
        onRefresh();
      }
      onClose();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật giao dịch");
    } finally {
      setSaving(false);
    }
  };

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
          {/* Close Icon Button */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Notches */}
          <View style={styles.notchLeft} />
          <View style={styles.notchRight} />

          {/* Bill Header */}
          <View style={styles.billHeader}>
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



            {/* Danh mục */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Danh mục</Text>
              <TouchableOpacity 
                style={[styles.detailValueContainer, { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setIsCategoryModalVisible(true)}
              >
                <Text style={[styles.detailValue, { color: selectedCategory ? Colors.text : Colors.textMuted }]}>
                  {selectedCategory ? selectedCategory.label : "Chọn danh mục"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textMuted} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            {/* Ghi chú */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ghi chú</Text>
              <View style={[styles.detailValueContainer, { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 8, width: '60%' }]}>
                <ReactNative.TextInput
                  style={[styles.detailValue, { width: '100%', paddingVertical: 4 }]}
                  value={editedNote}
                  onChangeText={setEditedNote}
                  placeholder="Nhập ghi chú..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionContainer, { flexDirection: 'row', gap: 12, marginTop: 24 }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Chia sẻ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: 8, flexDirection: 'row', gap: 6 }]}
              onPress={handleSaveChanges}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={Colors.white} />
                  <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 14 }}>Lưu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Custom Toast Alert */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </TouchableOpacity>

      <CategorySelectModal 
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(category, groupName) => {
          setSelectedCategory(category);
          setIsCategoryModalVisible(false);
        }}
        onAddCategory={() => setIsAddCategoryModalVisible(true)}
      />

      <AddCategoryModal 
        visible={isAddCategoryModalVisible}
        onClose={() => setIsAddCategoryModalVisible(false)}
        onBack={() => {
          setIsAddCategoryModalVisible(false);
          setTimeout(() => setIsCategoryModalVisible(true), 300);
        }}
      />
    </Modal>
  );
}
