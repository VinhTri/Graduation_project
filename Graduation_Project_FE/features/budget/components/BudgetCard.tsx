import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetItem, BudgetStatus, getBudgetStatus } from '../../../shared/contexts/BudgetContext';
import Colors from '../../../shared/constants/Colors';

interface BudgetCardProps {
  budget: BudgetItem;
  onEdit: (budget: BudgetItem) => void;
  onDelete: (id: string) => void;
}

const STATUS_CONFIG: Record<BudgetStatus, { barColor: string; textColor: string; badgeColor: string; badgeBg: string; label: string }> = {
  ok: {
    barColor: Colors.primary,
    textColor: Colors.primary,
    badgeColor: Colors.primary,
    badgeBg: Colors.primaryLight,
    label: 'Bình thường',
  },
  warning: {
    barColor: '#F59E0B',
    textColor: '#B45309',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    label: 'Sắp hết ngân sách',
  },
  exceeded: {
    barColor: '#EF4444',
    textColor: '#EF4444',
    badgeColor: '#EF4444',
    badgeBg: '#FEE2E2',
    label: 'Vượt ngân sách!',
  },
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const status = getBudgetStatus(budget.spent, budget.limit);
  const config = STATUS_CONFIG[status];
  const progress = budget.limit > 0 ? Math.min(budget.spent / budget.limit, 1) : 0;
  const percent = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
  const remaining = budget.limit - budget.spent;

  const handleDelete = () => {
    Alert.alert(
      'Xóa ngân sách',
      `Bạn có chắc muốn xóa ngân sách "${budget.categoryLabel}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => onDelete(budget.id) },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.card, status === 'exceeded' && styles.cardExceeded]}
      activeOpacity={0.7}
      onPress={() => onEdit(budget)}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: budget.categoryBgColor }]}>
            <Ionicons name={budget.categoryIcon as any} size={20} color={budget.categoryColor} />
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.categoryLabel}>{budget.categoryLabel}</Text>
            {(status === 'warning' || status === 'exceeded') && (
              <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
                <Ionicons
                  name={status === 'exceeded' ? 'warning' : 'alert-circle'}
                  size={10}
                  color={config.badgeColor}
                />
                <Text style={[styles.badgeText, { color: config.badgeColor }]}>{config.label}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: config.barColor }]} />
        </View>
        <Text style={[styles.percentText, { color: config.textColor }]}>{percent}%</Text>
      </View>

      {/* Amount info */}
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>Đã chi</Text>
          <Text style={[styles.amountValue, { color: config.textColor }]}>{formatCurrency(budget.spent)}</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View>
          <Text style={styles.amountLabel}>Giới hạn</Text>
          <Text style={styles.amountValue}>{formatCurrency(budget.limit)}</Text>
        </View>
        <View style={styles.dividerVertical} />
        <View>
          <Text style={styles.amountLabel}>{remaining >= 0 ? 'Còn lại' : 'Vượt quá'}</Text>
          <Text style={[styles.amountValue, { color: remaining >= 0 ? Colors.success : Colors.error }]}>
            {formatCurrency(Math.abs(remaining))}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardExceeded: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFAFA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    gap: 4,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
});

export default BudgetCard;
