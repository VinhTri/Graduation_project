import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { BudgetResponse } from '@/shared/types/budget'
import { applyToLabel, BUDGET_SOURCE_LABEL } from '../constants/applyTo'
import { BUDGET_STATUS_META } from '../constants/status'
import { formatDisplayDate } from '../utils/budgetFormat'
import { BudgetSpendBar } from './BudgetSpendBar'

type Props = {
  budget: BudgetResponse
  onPress: () => void
}

export function BudgetCard({ budget, onPress }: Props) {
  const statusMeta = BUDGET_STATUS_META[budget.status]
  const showDeletedHint =
    budget.categoryDeleted &&
    (budget.status === 'COMPLETED' || budget.status === 'INVALIDATED')

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: budget.categoryBgColor || PASTEL_PALETTE.lavenderSoft },
          ]}
        >
          <Ionicons
            name={(budget.categoryIcon as 'pie-chart-outline') || 'pie-chart-outline'}
            size={22}
            color={budget.categoryColor || PASTEL_PALETTE.title}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {budget.categoryName}
          </Text>
          <Text style={styles.meta}>
            {applyToLabel(budget.applyTo)} · {formatDisplayDate(budget.startDate)} –{' '}
            {formatDisplayDate(budget.endDate)}
          </Text>
          {showDeletedHint ? (
            <Text style={styles.deletedHint}>Danh mục đã xóa</Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.badgeText, { color: statusMeta.color }]} numberOfLines={2}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      {budget.notebook ? (
        <BudgetSpendBar label={BUDGET_SOURCE_LABEL.notebook} spend={budget.notebook} />
      ) : null}
      {budget.wallet ? (
        <BudgetSpendBar label={BUDGET_SOURCE_LABEL.wallet} spend={budget.wallet} />
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.textDark,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  deletedHint: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  badge: {
    maxWidth: 96,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
})
