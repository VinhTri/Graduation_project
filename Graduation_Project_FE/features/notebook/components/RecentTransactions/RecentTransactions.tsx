import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { RecentTransactionsProps } from "./RecentTransactions.types";
import { styles } from "./RecentTransactions.styles";

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const formatCurrency = (val: number, type: 'INCOME' | 'EXPENSE') => {
    const sign = type === 'INCOME' ? '+' : '-';
    return `${sign}${val.toLocaleString("vi-VN")} ₫`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
      
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy ghi chép các khoản thu chi đầu tiên của bạn để quản lý tài chính tốt hơn.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={[styles.iconContainer, { backgroundColor: `${tx.categoryColor}20` }]}>
                <Ionicons name={tx.categoryIcon as any} size={24} color={tx.categoryColor} />
              </View>
              
              <View style={styles.detailsContainer}>
                <Text style={styles.title} numberOfLines={1}>{tx.title}</Text>
                <Text style={styles.date}>{tx.date}</Text>
              </View>
              
              <View style={styles.amountContainer}>
                <Text 
                  style={[
                    styles.amount, 
                    { color: tx.type === 'INCOME' ? '#10B981' : Colors.text }
                  ]}
                >
                  {formatCurrency(tx.amount, tx.type)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default RecentTransactions;
