import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
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
  listTitle = 'Giao dịch tiền mặt',
  emptyTitle = 'Chưa có giao dịch tiền mặt',
  emptySubtitle = 'Bấm nút + để ghi khoản thu hoặc chi tiền mặt đầu tiên.',
  onPressItem,
  onDeleteItem,
}) => {
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{listTitle}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color={PASTEL_PALETTE.lavender} />
          <Text style={styles.emptyText}>{emptyTitle}</Text>
          <Text style={styles.emptySubtext}>{emptySubtitle}</Text>
        </View>
      </View>
    );
  }

  const groups = groupByDate(transactions);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    tx: TransactionItem
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 1],
      extrapolate: 'clamp',
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteActionWrap,
          { transform: [{ scale }, { translateX }] },
        ]}
      >
        <RectButton
          style={styles.swipeDeleteButton}
          onPress={() => onDeleteItem?.(tx)}
        >
          <LinearGradient
            colors={['#FCA5A5', '#EF4444', '#DC2626']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.swipeDeleteGradient}
          >
            <View style={styles.swipeDeleteIconCircle}>
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.swipeDeleteText}>Xóa</Text>
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{listTitle}</Text>
      {groups.map(([day, items]) => (
        <View key={day} style={styles.dayGroup}>
          <Text style={styles.dayLabel}>{day}</Text>
          <View style={styles.listCard}>
            {items.map((tx, index) => {
              const isIncome = tx.type === 'INCOME';
              const tone = isIncome ? INCOME_COLOR : EXPENSE_COLOR;
              
              const itemContent = (
                <RectButton
                  style={[
                    styles.transactionItem,
                    index === items.length - 1 && styles.transactionItemLast,
                    { backgroundColor: PASTEL_PALETTE.white }
                  ]}
                  onPress={() => onPressItem?.(tx)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: tx.categoryColor ? `${tx.categoryColor}22` : `${tone}18` }]}>
                    <Ionicons
                      name={(tx.categoryIcon as any) || (isIncome ? 'arrow-down-circle' : 'arrow-up-circle')}
                      size={24}
                      color={tx.categoryColor || tone}
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
                </RectButton>
              );

              if (onDeleteItem && tx.id) {
                return (
                  <Swipeable
                    key={tx.id}
                    renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, tx)}
                    friction={2}
                    rightThreshold={40}
                  >
                    {itemContent}
                  </Swipeable>
                );
              }

              return <React.Fragment key={tx.id}>{itemContent}</React.Fragment>;
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

export default RecentTransactions;
