import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { RecentTransactionsProps, TransactionItem } from './RecentTransactions.types';
import { styles } from './RecentTransactions.styles';

const INCOME_COLOR = '#059669';
const EXPENSE_COLOR = '#DC2626';

const formatCurrency = (val: number, type: 'INCOME' | 'EXPENSE') => {
  const sign = type === 'INCOME' ? '+' : '-';
  return `${sign}${val.toLocaleString('vi-VN')} ₫`;
};

const groupByDate = (transactions: TransactionItem[]) => {
  const map = new Map<string, TransactionItem[]>();
  transactions.forEach((tx) => {
    const key = tx.date || 'Khác';
    const list = map.get(key) || [];
    list.push(tx);
    map.set(key, list);
  });
  return Array.from(map.entries());
};

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onPressItem,
}) => {
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Giao dịch tiền mặt</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color={PASTEL_PALETTE.lavender} />
          <Text style={styles.emptyText}>Chưa có giao dịch tiền mặt</Text>
          <Text style={styles.emptySubtext}>
            Bấm nút + để ghi khoản thu hoặc chi tiền mặt đầu tiên.
          </Text>
        </View>
      </View>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Giao dịch tiền mặt</Text>
      {groups.map(([day, items]) => (
        <View key={day} style={styles.dayGroup}>
          <Text style={styles.dayLabel}>{day}</Text>
          <View style={styles.listCard}>
            {items.map((tx, index) => {
              const isIncome = tx.type === 'INCOME';
              const tone = isIncome ? INCOME_COLOR : EXPENSE_COLOR;
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[
                    styles.transactionItem,
                    index === items.length - 1 && styles.transactionItemLast,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => onPressItem?.(tx)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${tone}18` }]}>
                    <Ionicons
                      name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={24}
                      color={tone}
                    />
                  </View>
                  <View style={styles.detailsContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                      {tx.categoryLabel || tx.title}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {tx.note || (isIncome ? 'Thu nhập' : 'Chi tiêu')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.amount,
                      isIncome ? styles.amountIncome : styles.amountExpense,
                    ]}
                  >
                    {formatCurrency(tx.amount, tx.type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

export default RecentTransactions;
