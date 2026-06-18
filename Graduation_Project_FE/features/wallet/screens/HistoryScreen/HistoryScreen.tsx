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
    id: "tx-1",
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
    id: "tx-2",
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
    id: "tx-3",
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
    id: "tx-4",
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
    id: "tx-5",
    title: "Nạp tiền vào ví",
    type: "topup",
    amount: 200000,
    date: "05/06/2026, 11:20",
    status: "failed",
    icon: "add-circle",
    category: "Nạp tiền",
    notes: "Giao dịch nạp tiền thất bại do lỗi kết nối ngân hàng",
  }
];

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

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

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        activeOpacity={0.7}
        onPress={() => setSelectedTransaction(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: getTransactionIconBgColor(item.type) }]}>
          <Ionicons name={item.icon as any} size={24} color={getTransactionIconColor(item.type)} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle} numberOfLines={1}>{item.title}</Text>
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
            data={MOCK_TRANSACTIONS}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tiền vào (Tháng này)</Text>
                    <Text style={styles.summaryValueIn}>+700.000 ₫</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tiền ra (Tháng này)</Text>
                    <Text style={styles.summaryValueOut}>-475.000 ₫</Text>
                  </View>
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
