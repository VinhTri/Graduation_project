import { StyleSheet, Text, View } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { BudgetSourceSpend } from '@/shared/types/budget'
import { formatMoney, progressRatio, toSafeAmount } from '../utils/budgetFormat'

type Props = {
  label: string
  spend: BudgetSourceSpend
}

export function BudgetSpendBar({ label, spend }: Props) {
  const spent = toSafeAmount(spend.spent)
  const remaining = toSafeAmount(spend.remaining)
  const over = spend.overLimit || remaining < 0
  const ratio = progressRatio(spent, spend.limitAmount)
  const barWidth = `${Math.min(Math.max(ratio, 0) * 100, 100)}%` as `${number}%`

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.spent, over && styles.over]}>
          {formatMoney(spent)} / {formatMoney(spend.limitAmount)}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: barWidth },
            over ? styles.fillOver : styles.fillOk,
          ]}
        />
      </View>
      <Text style={[styles.remaining, over && styles.over]}>
        Còn lại: {formatMoney(remaining)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: PASTEL_PALETTE.textDark,
  },
  spent: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
  },
  track: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.gray100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  fillOk: {
    backgroundColor: PASTEL_PALETTE.lavender,
  },
  fillOver: {
    backgroundColor: '#EF4444',
  },
  remaining: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  over: {
    color: '#DC2626',
  },
})
