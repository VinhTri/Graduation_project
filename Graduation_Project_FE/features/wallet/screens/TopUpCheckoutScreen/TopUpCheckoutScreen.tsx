import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { ConfirmModal, SuccessModal } from "../../../../shared/components";
import { styles } from "./TopUpCheckoutScreen.styles";
import { transactionService } from "../../../../shared/api/services/transactionService";

export default function TopUpCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount, note, category, transactionCode, qrUrl, createdAt } = useLocalSearchParams();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling for transaction status
  useEffect(() => {
    if (!transactionCode) return;

    const pollTimer = setInterval(async () => {
      try {
        const res = await transactionService.getTransactionStatus(transactionCode as string);
        if (res.status === 'SUCCESS') {
          clearInterval(pollTimer);
          setShowSuccessModal(true);
        }
      } catch (error) {
        console.log("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [transactionCode]);

  const formatCurrency = (val: string | string[]) => {
    if (!val) return "0 ₫";
    const num = parseInt(val as string, 10);
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getCreationDateTime = () => {
    if (createdAt) {
      const dateObj = new Date(createdAt as string);
      const time = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
      const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`;
      return `${time} - ${dateStr}`;
    }
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const date = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
    return `${time} - ${date}`;
  };

  const txId = (transactionCode as string) || "TX" + Math.floor(Math.random() * 1000000000).toString();
  const qrImageUri = (qrUrl as string) || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + txId;

  const [showBackModal, setShowBackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleBack = () => {
    setShowBackModal(true);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán Hóa đơn</Text>
      </View>

      <View style={styles.content}>
        
        <View style={styles.cardContainer}>
          
          {/* Top: QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.brandContainer}>
              <Ionicons name="wallet" size={24} color={Colors.primary} />
              <Text style={styles.brandName}>SmartSpend Pay</Text>
            </View>
            
            <View style={styles.qrWrapper}>
              <Image 
                source={{ uri: qrImageUri }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.instructionText}>
              Sử dụng ứng dụng Ngân hàng để quét mã
            </Text>
          </View>

          {/* Middle: Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Số tiền thanh toán</Text>
            <Text style={styles.amountValue}>{formatCurrency(amount || "0")}</Text>
          </View>

          <View style={styles.divider} />

          {/* Bottom: Transaction Info */}
          <View style={styles.detailsSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã giao dịch</Text>
              <Text style={styles.infoValue}>{txId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian tạo</Text>
              <Text style={styles.infoValue}>{getCreationDateTime()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hết hạn sau</Text>
              <Text style={[styles.infoValue, { color: Colors.error }]}>{formatTime(timeLeft)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Danh mục</Text>
              <Text style={styles.infoValue}>{category || "Chưa chọn danh mục"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: "right", marginLeft: 16 }]} numberOfLines={3}>
                {note || "Chưa có ghi chú"}
              </Text>
            </View>
          </View>

        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Hủy giao dịch</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Confirmation Modals */}
      <ConfirmModal
        visible={showBackModal}
        title="Giao dịch chưa hoàn thành"
        message="Bạn đang có giao dịch chưa hoàn thành. Bạn có muốn trở về trang ví?"
        iconName="warning"
        iconColor={Colors.warning || "#F59E0B"}
        confirmText="Trở về"
        cancelText="Ở lại"
        isDestructive={false}
        onConfirm={() => {
          setShowBackModal(false);
          router.replace('/(tabs)/wallet');
        }}
        onCancel={() => setShowBackModal(false)}
      />

      <ConfirmModal
        visible={showCancelModal}
        title="Xác nhận hủy"
        message="Bạn có chắc chắn muốn hủy giao dịch này?"
        iconName="alert-circle"
        iconColor={Colors.error}
        confirmText="Đồng ý hủy"
        cancelText="Không"
        isDestructive={true}
        onConfirm={() => {
          setShowCancelModal(false);
          router.replace('/(tabs)/wallet');
        }}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Thanh toán thành công"
        message="Tiền đã được nạp thành công vào ví của bạn."
        isAutoClose={true}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/wallet');
        }}
      />
    </View>
  );
}
