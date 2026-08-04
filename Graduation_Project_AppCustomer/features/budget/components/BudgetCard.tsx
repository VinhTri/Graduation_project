import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetResponse } from '../../../shared/api/budgetApi';
import { useTheme, useLanguage } from '../../../shared/contexts/ThemeLanguageContext';

interface BudgetCardProps {
  budget: BudgetResponse;
  onPress: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onPress }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const percentage = Math.min(100, Math.max(0, (budget.spentAmount / budget.amount) * 100));

  let progressColor = '#10B981';
  if (percentage >= 100) {
    progressColor = '#EF4444';
  } else if (percentage >= 80) {
    progressColor = '#F97316';
  } else if (percentage >= 50) {
    progressColor = '#F59E0B';
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const remaining = budget.amount - budget.spentAmount;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const getStatusText = () => {
    if (percentage >= 100) return isEn ? '🔴 Exceeded' : '🔴 Đã vượt';
    if (percentage >= 80) return isEn ? '🟠 Near Limit' : '🟠 Sắp vượt';
    return isEn ? '🟢 Normal' : '🟢 Bình thường';
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? theme.bgSoft : (budget.categoryBgColor || theme.primarySoft) }]}>
            <Ionicons name={(budget.categoryIcon as any) || 'pie-chart-outline'} size={20} color={budget.categoryColor || theme.primary} />
          </View>
          <View>
            <Text style={[styles.budgetName, { color: theme.textPrimary }]}>{budget.name}</Text>
            <Text style={[styles.categoryName, { color: theme.textSecondary }]}>{budget.categoryName}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.statusBadge, { backgroundColor: theme.bgSoft }]}>
            <Text style={[styles.cycleText, { color: theme.textSecondary }]}>
              {budget.cycle === 'WEEKLY' ? (isEn ? 'Weekly' : 'Tuần') : budget.cycle === 'MONTHLY' ? (isEn ? 'Monthly' : 'Tháng') : (isEn ? 'Yearly' : 'Năm')}
            </Text>
          </View>
          {(budget.startDate && budget.endDate) && (
            <Text style={[styles.dateRangeText, { color: theme.textMuted }]}>
              {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.amountInfo}>
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{isEn ? 'Spent' : 'Đã chi'}</Text>
          <Text style={[styles.spentText, { color: theme.textPrimary }]}>{formatCurrency(budget.spentAmount)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{isEn ? 'Remaining' : 'Còn lại'}</Text>
          <Text style={[styles.remainingText, { color: remaining < 0 ? '#EF4444' : (theme.isDark ? '#34D399' : '#10B981') }]}>
            {formatCurrency(Math.max(0, remaining))}
          </Text>
        </View>
      </View>

      <View style={[styles.progressContainer, { backgroundColor: theme.bgSoft }]}>
        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: progressColor }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.statusIndicatorText, { color: theme.textPrimary }]}>{getStatusText()}</Text>
        <Text style={[styles.percentageText, { color: theme.textSecondary }]}>{percentage.toFixed(1)}%</Text>
        <Text style={[styles.limitText, { color: theme.textMuted }]}>{isEn ? 'Limit: ' : 'Hạn mức: '}{formatCurrency(budget.amount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryName: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cycleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateRangeText: {
    fontSize: 10,
    marginTop: 4,
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  spentText: {
    fontSize: 16,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
    marginRight: 8,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  limitText: {
    fontSize: 12,
  },
});
