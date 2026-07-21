import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetResponse } from '../../../shared/api/budgetApi';
import { PASTEL_PALETTE } from '../../../shared/constants/PastelPalette';

interface BudgetCardProps {
  budget: BudgetResponse;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onPress, onEdit, onDelete }) => {
  const percentage = Math.min(100, Math.max(0, (budget.spentAmount / budget.amount) * 100));
  
  let progressColor = '#10B981'; // Green < 50%
  if (percentage >= 100) {
    progressColor = '#EF4444'; // Red = 100%
  } else if (percentage >= 80) {
    progressColor = '#F97316'; // Orange 80-99%
  } else if (percentage >= 50) {
    progressColor = '#F59E0B'; // Yellow 50-79%
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
    if (percentage >= 100) return '🔴 Đã vượt';
    if (percentage >= 80) return '🟠 Sắp vượt';
    return '🟢 Bình thường';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={[styles.iconContainer, { backgroundColor: budget.categoryBgColor }]}>
            <Ionicons name={budget.categoryIcon as any} size={20} color={budget.categoryColor} />
          </View>
          <View>
            <Text style={styles.budgetName}>{budget.name}</Text>
            <Text style={styles.categoryName}>{budget.categoryName}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.statusBadge}>
              <Text style={styles.cycleText}>
                {budget.cycle === 'WEEKLY' ? 'Tuần' : budget.cycle === 'MONTHLY' ? 'Tháng' : 'Năm'}
              </Text>
            </View>
            {(budget.startDate && budget.endDate) && (
              <Text style={styles.dateRangeText}>
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
              </Text>
            )}
          </View>
          {onEdit && (
            <TouchableOpacity 
              onPress={(e) => {
                e?.stopPropagation?.();
                onEdit();
              }} 
              style={styles.editButton}
              activeOpacity={0.6}
            >
              <Ionicons name="pencil-outline" size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              onPress={(e) => {
                e?.stopPropagation?.();
                onDelete();
              }} 
              style={styles.deleteButton}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.amountInfo}>
        <View>
          <Text style={styles.label}>Đã chi</Text>
          <Text style={styles.spentText}>{formatCurrency(budget.spentAmount)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Còn lại</Text>
          <Text style={[styles.remainingText, remaining < 0 && { color: '#EF4444' }]}>
            {formatCurrency(Math.max(0, remaining))}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: progressColor }]} />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.statusIndicatorText}>{getStatusText()}</Text>
        <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
        <Text style={styles.limitText}>Hạn mức: {formatCurrency(budget.amount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.gray100,
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
    color: PASTEL_PALETTE.textDark,
  },
  categoryName: {
    fontSize: 13,
    color: PASTEL_PALETTE.textGray,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: PASTEL_PALETTE.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cycleText: {
    fontSize: 12,
    color: PASTEL_PALETTE.textGray,
    fontWeight: '500',
  },
  dateRangeText: {
    fontSize: 10,
    color: PASTEL_PALETTE.textGray,
    marginTop: 4,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cheatButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: PASTEL_PALETTE.textGray,
    marginBottom: 4,
  },
  spentText: {
    fontSize: 16,
    fontWeight: '700',
    color: PASTEL_PALETTE.textDark,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  progressContainer: {
    height: 8,
    backgroundColor: PASTEL_PALETTE.gray100,
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
    color: PASTEL_PALETTE.textGray,
    marginLeft: 'auto',
    marginRight: 8,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textDark,
  },
  limitText: {
    fontSize: 12,
    color: PASTEL_PALETTE.textGray,
  },
});
