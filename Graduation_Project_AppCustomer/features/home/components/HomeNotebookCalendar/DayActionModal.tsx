import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from './DayActionModal.styles';
import { TransactionItem } from '@/features/notebook/components/RecentTransactions/RecentTransactions.types';
import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';

interface DayActionModalProps {
  visible: boolean;
  dateStr: string; // "YYYY-MM-DD"
  displayDateText: string;
  transactions: TransactionItem[];
  isFuture?: boolean;
  onClose: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onPressTransaction?: (tx: TransactionItem) => void;
}

export const DayActionModal: React.FC<DayActionModalProps> = ({
  visible,
  dateStr,
  displayDateText,
  transactions,
  isFuture = false,
  onClose,
  onAddIncome,
  onAddExpense,
  onPressTransaction,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const totalIncome = transactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const handleNavigateNotebook = () => {
    onClose();
    router.push('/(tabs)/notebook' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{displayDateText}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {isFuture
                  ? isEn
                    ? 'Future date'
                    : 'Ngày trong tương lai'
                  : transactions.length > 0
                  ? isEn
                    ? `${transactions.length} transaction(s)`
                    : `${transactions.length} giao dịch được ghi nhận`
                  : t('noDayTransactions')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.isDark ? theme.bgSoft : '#F3F4F6' }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                styles.summaryCardIncome,
                theme.isDark && { backgroundColor: '#064E3B22', borderColor: '#05966944' },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: '#059669' }]}>
                {t('totalIncome')}
              </Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>
                +{totalIncome.toLocaleString('vi-VN')} ₫
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                styles.summaryCardExpense,
                theme.isDark && { backgroundColor: '#7F1D1D22', borderColor: '#DC262644' },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>
                {t('totalExpense')}
              </Text>
              <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                -{totalExpense.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </View>

          {/* Action Buttons or Future Banner */}
          {isFuture ? (
            <View
              style={[
                styles.futureBanner,
                {
                  backgroundColor: theme.isDark ? theme.bgSoft : '#F3F4F6',
                  borderColor: theme.isDark ? theme.cardBorder : '#E5E7EB',
                },
              ]}
            >
              <Ionicons name="lock-closed" size={17} color={theme.textMuted} />
              <Text style={[styles.futureBannerText, { color: theme.textMuted }]}>
                {isEn
                  ? 'Future date - Cannot record transactions'
                  : 'Ngày trong tương lai • Không thể ghi chép trước'}
              </Text>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnIncome]}
                activeOpacity={0.8}
                onPress={onAddIncome}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{t('recordIncome')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnExpense]}
                activeOpacity={0.8}
                onPress={onAddExpense}
              >
                <Ionicons name="remove-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{t('recordExpense')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Transactions List */}
          <Text style={[styles.txSectionHeader, { color: theme.textPrimary }]}>
            {t('dayTransactions')}
          </Text>

          <ScrollView
            style={styles.txList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  {t('noDayTransactions')}
                </Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const iconColor = tx.categoryColor || (isIncome ? '#059669' : '#DC2626');
                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={[
                      styles.txItem,
                      {
                        backgroundColor: theme.isDark ? theme.bgSoft : '#F9FAFB',
                        borderColor: theme.cardBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => onPressTransaction?.(tx)}
                  >
                    <View
                      style={[
                        styles.txIconBox,
                        { backgroundColor: `${iconColor}20` },
                      ]}
                    >
                      <Ionicons
                        name={(tx.categoryIcon as any) || 'cash-outline'}
                        size={20}
                        color={iconColor}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text
                        style={[styles.txTitle, { color: theme.textPrimary }]}
                        numberOfLines={1}
                      >
                        {tx.categoryLabel || tx.title}
                      </Text>
                      {!!tx.note && (
                        <Text
                          style={[styles.txNote, { color: theme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {tx.note}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        isIncome ? styles.txAmountIncome : styles.txAmountExpense,
                      ]}
                    >
                      {isIncome ? '+' : '-'}
                      {(Number(tx.amount) || 0).toLocaleString('vi-VN')} ₫
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* View All Button */}
          <TouchableOpacity
            style={[
              styles.viewAllBtn,
              {
                backgroundColor: theme.isDark ? theme.bgSoft : '#F5F3FF',
                borderColor: theme.isDark ? theme.cardBorder : '#DDD6FE',
              },
            ]}
            activeOpacity={0.8}
            onPress={handleNavigateNotebook}
          >
            <Ionicons name="book-outline" size={18} color={theme.primary} />
            <Text style={[styles.viewAllBtnText, { color: theme.primary }]}>
              {t('viewNotebookDetail')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DayActionModal;
