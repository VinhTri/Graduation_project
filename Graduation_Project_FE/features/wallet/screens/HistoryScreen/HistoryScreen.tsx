import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./HistoryScreen.styles";
import { TransactionDetailModal } from "../../components";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { useCategoryContext } from "../../../../shared/contexts/CategoryContext";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories } = useCategoryContext();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "today">("all");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactionHistory();
      
      const mapped = data.map((t: any) => {
        const typeLower = t.type.toLowerCase().replace('_', ''); // TOP_UP -> topup, WITHDRAW -> withdraw, others -> payment
        const isTopUp = t.type === 'TOP_UP';
        const isWithdraw = t.type === 'WITHDRAW';
        
        // Find category details
        let catLabel = isTopUp ? 'Nạp tiền' : (isWithdraw ? 'Rút tiền' : 'Giao dịch');
        let icon = isTopUp ? 'add-circle' : (isWithdraw ? 'cash' : 'receipt-outline');
        
        if (t.categoryId) {
          for (const group of categories) {
            const found = group.items.find((item: any) => String(item.id) === String(t.categoryId));
            if (found) {
              catLabel = found.label;
              icon = found.icon;
              break;
            }
          }
        }
        
        return {
          id: t.transactionCode,
          title: isTopUp ? "Nạp tiền vào ví" : (isWithdraw ? "Rút tiền về ngân hàng" : t.note || "Thanh toán dịch vụ"),
          type: typeLower,
          typeOriginal: t.type,
          amount: isTopUp ? t.amount : -t.amount,
          date: formatDate(t.createdAt),
          dateRaw: t.createdAt,
          status: t.status.toLowerCase(),
          icon: icon,
          category: catLabel,
          categoryId: t.categoryId,
          notes: t.note,
        };
      });
      
      setTransactions(mapped);
    } catch (error) {
      console.error("Failed to load transaction history", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [categories])
  );

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString("vi-VN") + " ₫";
    return isNegative ? `-${formatted}` : `+${formatted}`;
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

  const renderTransactionItem = ({ item }: { item: any }) => {
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

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr);
      const today = new Date();
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    } catch (e) {
      return false;
    }
  };

  const filteredTransactions = transactions.filter(item => 
    filterMode === "today" ? isToday(item.dateRaw) : true
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
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
          )}
        </View>
      </View>

      <TransactionDetailModal
        visible={selectedTransaction !== null}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onRefresh={fetchTransactions}
      />
    </View>
  );
}
