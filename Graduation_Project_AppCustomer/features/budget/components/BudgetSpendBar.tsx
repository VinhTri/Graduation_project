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
  const percent = Math.round(ratio * 100)
  const barWidth = `${Math.min(Math.max(ratio, 0) * 100, 100)}%` as `${number}%`

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percent, ratio >= 0.8 && styles.warning, over && styles.over]}>
          {percent}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: barWidth },
            over ? styles.fillOver : ratio >= 0.8 ? styles.fillWarning : styles.fillOk,
          ]}
        />
      </View>
      <View style={styles.captionRow}>
        <Text style={styles.spent}>{formatMoney(spent)} / {formatMoney(spend.limitAmount)}</Text>
        <Text style={[styles.remaining, over && styles.over]}>
          {over ? 'Vượt' : 'Còn'} {formatMoney(Math.abs(remaining))}
        </Text>
      </View>
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
  percent: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7655B4',
    fontVariant: ['tabular-nums'],
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
  fillWarning: {
    backgroundColor: '#E29A55',
  },
  fillOver: {
    backgroundColor: '#EF4444',
  },
  captionRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  remaining: {
    fontSize: 12,
    fontWeight: '800',
    color: PASTEL_PALETTE.subtitle,
  },
  warning: {
    color: '#C8752D',
  },
  over: {
    color: '#DC2626',
  },
})
