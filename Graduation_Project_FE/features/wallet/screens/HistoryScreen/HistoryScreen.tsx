import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  FlatList
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./HistoryScreen.styles";
import { TransactionDetailModal } from "../../components";

// Mock Data for UI demonstration
const MOCK_TRANSACTIONS = [
  {
    id: "FT26061809012394",
    title: "Nạp tiền vào ví",
    type: "topup", // topup, withdraw, payment
    amount: 500000,
    date: "18/06/2026, 14:30",
    status: "success", // success, pending, failed
    icon: "add-circle",
    category: "Nạp tiền",
    notes: "Nạp tiền từ tài khoản Vietcombank liên kết",
  },
  {
    id: "POS892138902138",
    title: "Thanh toán Highlands Coffee",
    type: "payment",
    amount: -55000,
    date: "17/06/2026, 09:15",
    status: "success",
    icon: "cafe",
    category: "Ăn uống",
    notes: "Thanh toán 2 ly bạc xỉu tại Highlands Coffee Landmark 81",
  },
  {
    id: "FT26061099281723",
    title: "Rút tiền về ngân hàng",
    type: "withdraw",
    amount: -100000,
    date: "10/06/2026, 16:45",
    status: "pending",
    icon: "cash",
    category: "Rút tiền",
    notes: "Rút tiền về tài khoản ngân hàng cá nhân",
  },
  {
    id: "ECOM902381023912",
    title: "Thanh toán Shopee",
    type: "payment",
    amount: -320000,
    date: "08/06/2026, 20:00",
    status: "success",
    icon: "cart",
    category: "Mua sắm",
    notes: "Thanh toán đơn hàng quần áo trên sàn Shopee",
  },
  {
    id: "FT26060511209384",
    title: "Nạp tiền vào ví",
    type: "topup",
    amount: 200000,
    date: "05/06/2026, 11:20",
    status: "failed",
    icon: "add-circle",
    category: "Nạp tiền",
    notes: "Giao dịch nạp tiền thất bại do lỗi kết nối ngân hàng",
  },
  {
    id: "FT26062218301293",
    title: "Chuyển tiền cho bạn bè",
    type: "payment",
    amount: -150000,
    date: "22/06/2026, 18:30",
    status: "success",
    icon: "swap-horizontal",
    category: "Chuyển tiền",
    notes: "Trả tiền ăn trưa",
  },
  {
    id: "FT26062209003841",
    title: "Nhận tiền từ người thân",
    type: "topup",
    amount: 1000000,
    date: "22/06/2026, 09:00",
    status: "success",
    icon: "download",
    category: "Nhận tiền",
    notes: "Tiền tiêu vặt tháng này",
  }
];

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "today">("all");

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString("vi-VN") + " ₫";
    return isNegative ? `-${formatted}` : `+${formatted}`;
  };

  const getTransactionIconColor = (type: string) => {
    switch (type) {
      case "topup": return Colors.success;
      case "payment": return Colors.primary;
      case "withdraw": return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const getTransactionIconBgColor = (type: string) => {
    const color = getTransactionIconColor(type);
    return color + "1A"; // 10% opacity
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return Colors.success;
      case "pending": return Colors.warning;
      case "failed": return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success": return "Thành công";
      case "pending": return "Đang xử lý";
      case "failed": return "Thất bại";
      default: return status;
    }
  };

  const renderTransactionItem = ({ item }: { item: typeof MOCK_TRANSACTIONS[0] }) => {
    const isPositive = item.amount > 0;
    const displayTitle = item.type === "topup" ? "Tiền vào" : "Tiền ra";
    const staticIcon = isPositive ? "arrow-down-circle" : "arrow-up-circle";
    const staticIconColor = isPositive ? Colors.success : Colors.error;
    const staticIconBgColor = isPositive ? Colors.success + "1A" : Colors.error + "1A";

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        activeOpacity={0.7}
        onPress={() => setSelectedTransaction(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: staticIconBgColor }]}>
          <Ionicons name={staticIcon as any} size={24} color={staticIconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle} numberOfLines={1}>{displayTitle}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={[
            styles.transactionAmount,
            { color: isPositive ? Colors.success : Colors.text }
          ]}>
            {formatCurrency(item.amount)}
          </Text>
          <Text style={[styles.transactionStatus, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Background filler for iOS safe area */}
      <View style={{ backgroundColor: Colors.primary, height: insets.top, position: 'absolute', top: 0, left: 0, right: 0 }} />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        </View>

        {/* Main Content Area */}
        <View style={styles.content}>
          <FlatList
            data={MOCK_TRANSACTIONS
              .filter(item => filterMode === "today" ? item.date.startsWith("22/06/2026") : true)
              .sort((a, b) => {
                const parseDate = (dateStr: string) => {
                  const [datePart, timePart] = dateStr.split(", ");
                  const [day, month, year] = datePart.split("/");
                  const [hour, minute] = timePart.split(":");
                  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
                };
                return parseDate(b.date) - parseDate(a.date);
              })}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                  <TouchableOpacity 
                    style={[styles.filterTab, filterMode === "all" && styles.filterTabActive]}
                    onPress={() => setFilterMode("all")}
                  >
                    <Text style={[styles.filterTabText, filterMode === "all" && styles.filterTabTextActive]}>Tất cả</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterTab, filterMode === "today" && styles.filterTabActive]}
                    onPress={() => setFilterMode("today")}
                  >
                    <Text style={[styles.filterTabText, filterMode === "today" && styles.filterTabTextActive]}>Hôm nay</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
              </>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={Colors.border} />
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            )}
          />
        </View>
      </View>

      <TransactionDetailModal
        visible={selectedTransaction !== null}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </View>
  );
}
