import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView
} from "react-native";
import * as ReactNative from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./TransactionDetailModal.styles";
import { CategorySelectModal } from "../../../categories/components/CategorySelectModal";
import { AddCategoryModal } from "../../../categories/components/AddCategoryModal";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { useCategoryContext } from "../../../../shared/contexts/CategoryContext";

// Safe dynamic lookup for Clipboard to support newer React Native versions without TS compile errors
const NativeClipboard = (ReactNative as any).Clipboard;

const NOTE_MAX_LENGTH = 150;

export interface Transaction {
  id: string;
  title: string;
  type: string; // topup, withdraw, payment
  amount: number;
  date: string;
  status: string; // success, pending, failed
  icon: string;
  category?: string;
  categoryId?: number | string;
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
  const { categories } = useCategoryContext();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [editedNote, setEditedNote] = useState<string>("");
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tìm danh mục đầy đủ (icon, màu, nhóm) theo id để hiển thị trực quan.
  const findFullCategory = (categoryId: any) => {
    for (const group of categories || []) {
      const found = (group.items || []).find(
        (item: any) => String(item.id) === String(categoryId)
      );
      if (found) {
        return { ...found, groupName: group.title };
      }
    }
    return null;
  };

  useEffect(() => {
    if (transaction) {
      setEditedNote(transaction.notes || "");
      if (transaction.categoryId) {
        const full = findFullCategory(transaction.categoryId);
        if (full) {
          setSelectedCategory(full);
        } else if ((transaction as any).categoryLabel) {
          setSelectedCategory({
            id: transaction.categoryId,
            label: (transaction as any).categoryDeleted
              ? `${(transaction as any).categoryLabel} (đã xóa)`
              : (transaction as any).categoryLabel,
            icon: (transaction as any).categoryIcon || 'archive-outline',
            deleted: (transaction as any).categoryDeleted,
          });
        } else {
          setSelectedCategory({
            id: transaction.categoryId,
            label: 'Danh mục đã xóa',
            icon: 'archive-outline',
            deleted: true,
          });
        }
      } else {
        setSelectedCategory(null);
      }
    }
  }, [transaction, categories]);

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
  // Chỉ giao dịch nạp tiền và rút tiền mới cần phân loại (danh mục/ghi chú).
  const isTopUp = transaction.type === "topup";
  const isWithdraw = transaction.type === "withdraw";
  const canEditClassification = isTopUp || isWithdraw;

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          onPress={() => Keyboard.dismiss()} // Bấm vùng trống trong hóa đơn để ẩn bàn phím
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



            {/* Danh mục & Ghi chú — nạp tiền và rút tiền */}
            {canEditClassification && (
              <>
                {/* Danh mục */}
                <View style={styles.classifyBlock}>
                  <Text style={styles.detailLabel}>Danh mục</Text>
                  <TouchableOpacity
                    style={styles.categorySelector}
                    onPress={() => setIsCategoryModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: selectedCategory?.bgColor || Colors.border + "55" },
                        ]}
                      >
                        <Ionicons
                          name={(selectedCategory?.icon as any) || "pricetag-outline"}
                          size={16}
                          color={selectedCategory?.color || Colors.textMuted}
                        />
                      </View>
                      <View style={{ flexShrink: 1 }}>
                        <Text
                          style={[
                            styles.categoryLabel,
                            { color: selectedCategory ? Colors.text : Colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {selectedCategory ? selectedCategory.label : "Chọn danh mục"}
                        </Text>
                        {selectedCategory?.groupName ? (
                          <Text style={styles.categoryGroup} numberOfLines={1}>
                            {selectedCategory.groupName}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Ghi chú */}
                <View style={styles.classifyBlock}>
                  <View style={styles.noteHeaderRow}>
                    <Text style={styles.detailLabel}>Ghi chú</Text>
                    <Text style={styles.noteCounter}>
                      {editedNote.length}/{NOTE_MAX_LENGTH}
                    </Text>
                  </View>
                  <ReactNative.TextInput
                    style={styles.noteInput}
                    value={editedNote}
                    onChangeText={setEditedNote}
                    placeholder={
                      isWithdraw
                        ? "Nhập ghi chú cho giao dịch rút tiền..."
                        : "Nhập ghi chú để phân loại chi tiêu..."
                    }
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={NOTE_MAX_LENGTH}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
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

            {/* Nút Lưu — phân loại danh mục/ghi chú cho nạp tiền và rút tiền */}
            {canEditClassification && (
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
            )}
          </View>
        </TouchableOpacity>

        {/* Custom Toast Alert */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
      </KeyboardAvoidingView>

      <CategorySelectModal 
        visible={isCategoryModalVisible && !isAddCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(category, groupName) => {
          // Lưu đầy đủ icon/màu kèm tên nhóm để hiển thị trực quan.
          setSelectedCategory({ ...category, groupName });
          setIsCategoryModalVisible(false);
        }}
        onAddCategory={() => {
          setIsCategoryModalVisible(false);
          setTimeout(() => setIsAddCategoryModalVisible(true), 350);
        }}
      />

      <AddCategoryModal 
        visible={isAddCategoryModalVisible}
        onClose={() => setIsAddCategoryModalVisible(false)}
        onBack={() => {
          setIsAddCategoryModalVisible(false);
          setTimeout(() => setIsCategoryModalVisible(true), 350);
        }}
      />
    </Modal>
  );
}
