import { StyleSheet, Text, View } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { BudgetResponse } from '@/shared/types/budget'
import { formatMoney, toSafeAmount } from '../utils/budgetFormat'

type Props = {
  budgets: BudgetResponse[]
}

function sourceSpent(budget: BudgetResponse): number {
  let total = 0
  if (budget.notebook) total += toSafeAmount(budget.notebook.spent)
  if (budget.wallet) total += toSafeAmount(budget.wallet.spent)
  return total
}

export function BudgetSummary({ budgets }: Props) {
  const activeBudgets = budgets.filter((b) => b.status !== 'INVALIDATED')
  const totalLimit = activeBudgets.reduce((sum, b) => sum + toSafeAmount(b.limitAmount), 0)
  const active = budgets.filter((b) => b.status === 'ACTIVE')
  const upcoming = budgets.filter((b) => b.status === 'UPCOMING')
  const completed = budgets.filter((b) => b.status === 'COMPLETED')
  const invalidated = budgets.filter((b) => b.status === 'INVALIDATED')
  const activeLimit = active.reduce((sum, b) => sum + toSafeAmount(b.limitAmount), 0)
  const activeSpent = active.reduce((sum, b) => sum + sourceSpent(b), 0)

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tổng quan ngân sách</Text>
      <Text style={styles.totalLabel}>Tổng hạn mức (còn hiệu lực)</Text>
      <Text style={styles.totalValue}>{formatMoney(totalLimit)}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{active.length}</Text>
          <Text style={styles.statLabel}>Hoạt động</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{upcoming.length}</Text>
          <Text style={styles.statLabel}>Chưa bắt đầu</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completed.length}</Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{invalidated.length}</Text>
          <Text style={styles.statLabel}>Hết hiệu lực</Text>
        </View>
      </View>

      {active.length > 0 ? (
        <View style={styles.activeBox}>
          <Text style={styles.activeTitle}>Đang hoạt động</Text>
          <Text style={styles.activeLine}>
            Hạn mức {formatMoney(activeLimit)} · Đã chi {formatMoney(activeSpent)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    padding: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  totalLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  totalValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    color: PASTEL_PALETTE.textDark,
  },
  statsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: PASTEL_PALETTE.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
  },
  activeBox: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  activeLine: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
})
