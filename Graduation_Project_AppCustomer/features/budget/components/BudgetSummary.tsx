import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle } from 'react-native-svg'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { BudgetResponse } from '@/shared/types/budget'
import { formatMoney, toSafeAmount } from '../utils/budgetFormat'

type Props = {
  budgets: BudgetResponse[]
  periodLabel: string
}

const RING_SIZE = 86
const RING_STROKE = 8
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function sourceSpent(budget: BudgetResponse): number {
  if (budget.total) return toSafeAmount(budget.total.spent)
  return toSafeAmount(budget.notebook?.spent) + toSafeAmount(budget.wallet?.spent)
}

export function BudgetSummary({ budgets, periodLabel }: Props) {
  const active = budgets.filter((budget) => budget.status === 'ACTIVE')
  const totalLimit = active.reduce((sum, budget) => sum + toSafeAmount(budget.limitAmount), 0)
  const totalSpent = active.reduce((sum, budget) => sum + sourceSpent(budget), 0)
  const notebookSpent = active.reduce((sum, budget) => sum + toSafeAmount(budget.notebook?.spent), 0)
  const walletSpent = active.reduce((sum, budget) => sum + toSafeAmount(budget.wallet?.spent), 0)
  const remaining = totalLimit - totalSpent
  const rawPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const percent = Math.round(rawPercent)
  const ringProgress = Math.min(Math.max(rawPercent / 100, 0), 1)
  const ringColor = rawPercent >= 100 ? '#D9486F' : rawPercent >= 80 ? '#D9823D' : '#7655B4'
  const insight = active.length === 0
    ? 'Tạo ngân sách đầu tiên để bắt đầu kiểm soát chi tiêu.'
    : rawPercent >= 100
      ? `Bạn đã vượt hạn mức ${formatMoney(Math.abs(remaining))}.`
      : rawPercent >= 80
        ? 'Bạn đang gần chạm hạn mức. Hãy ưu tiên các khoản cần thiết.'
        : 'Chi tiêu vẫn trong kế hoạch. Hãy duy trì nhịp độ hiện tại.'

  return (
    <View style={styles.wrap}>
      <View style={styles.contextRow}>
        <Text style={styles.eyebrow}>TỔNG QUAN NGÂN SÁCH</Text>
      </View>
      <View style={styles.topRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>Bạn còn có thể chi</Text>
          <Text
            style={[styles.remainingValue, remaining < 0 && styles.remainingOver]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatMoney(remaining)}
          </Text>
          <Text style={styles.activeCount}>{active.length} ngân sách đang hoạt động</Text>
          <View style={styles.periodBadge}>
            <Ionicons name="calendar-clear-outline" size={12} color="#6D4AAF" />
            <Text style={styles.periodText}>{periodLabel}</Text>
            <View style={styles.liveDot} />
          </View>
        </View>

        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#EEE8F1"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={ringColor}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringProgress)}
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringLabel}>
            <Text style={[styles.ringPercent, { color: ringColor }]}>{percent}%</Text>
            <Text style={styles.ringCaption}>đã dùng</Text>
          </View>
        </View>
      </View>

      <View style={styles.moneyRow}>
        <View style={styles.moneyItem}>
          <Text style={styles.moneyLabel}>Đã chi</Text>
          <Text style={styles.moneyValue}>{formatMoney(totalSpent)}</Text>
        </View>
        <View style={styles.moneyDivider} />
        <View style={styles.moneyItem}>
          <Text style={styles.moneyLabel}>Tổng hạn mức</Text>
          <Text style={styles.moneyValue}>{formatMoney(totalLimit)}</Text>
        </View>
      </View>

      <View style={styles.sourceRow}>
        <View style={styles.sourceItem}>
          <View style={[styles.sourceIcon, styles.notebookIcon]}>
            <Ionicons name="book-outline" size={15} color="#7655B4" />
          </View>
          <View style={styles.sourceCopy}>
            <Text style={styles.sourceLabel}>Sổ tay</Text>
            <Text style={styles.sourceValue}>{formatMoney(notebookSpent)}</Text>
          </View>
        </View>
        <View style={styles.sourceItem}>
          <View style={[styles.sourceIcon, styles.walletIcon]}>
            <Ionicons name="wallet-outline" size={15} color="#B33B6E" />
          </View>
          <View style={styles.sourceCopy}>
            <Text style={styles.sourceLabel}>Ví SmartSpend</Text>
            <Text style={styles.sourceValue}>{formatMoney(walletSpent)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.insight, rawPercent >= 80 && styles.insightWarning]}>
        <Ionicons
          name={rawPercent >= 80 ? 'alert-circle-outline' : 'sparkles-outline'}
          size={17}
          color={rawPercent >= 80 ? '#A85A24' : '#6D4AAF'}
        />
        <Text
          style={[styles.insightText, rawPercent >= 80 && styles.insightWarningText]}
          numberOfLines={2}
        >
          {insight}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    padding: 13,
    paddingBottom: 12,
    borderRadius: 21,
    backgroundColor: '#FFFDFE',
    borderWidth: 1,
    borderColor: '#EADFEB',
    shadowColor: '#72527D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  contextRow: { flexDirection: 'row', alignItems: 'center' },
  periodBadge: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 8,
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
    backgroundColor: '#F2ECFA',
  },
  periodText: { fontSize: 9, fontWeight: '900', color: '#5E4967', fontVariant: ['tabular-nums'] },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#48A77B' },
  topRow: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9, color: '#9B7B97' },
  title: { marginTop: 3, fontSize: 12, fontWeight: '700', color: '#6F6372' },
  remainingValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.7,
    color: PASTEL_PALETTE.title,
    fontVariant: ['tabular-nums'],
  },
  remainingOver: { color: '#C73E63' },
  activeCount: { marginTop: 3, fontSize: 9, fontWeight: '600', color: '#968997' },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringPercent: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  ringCaption: { marginTop: -1, fontSize: 8, fontWeight: '700', color: '#968997' },
  moneyRow: {
    marginTop: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0E8F0',
  },
  moneyItem: { flex: 1 },
  moneyDivider: { width: 1, marginHorizontal: 13, backgroundColor: '#ECE3EC' },
  moneyLabel: { fontSize: 10, fontWeight: '700', color: '#948696' },
  moneyValue: { marginTop: 2, fontSize: 12, fontWeight: '900', color: '#3A303E', fontVariant: ['tabular-nums'] },
  sourceRow: { marginTop: 8, flexDirection: 'row', gap: 9 },
  sourceItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
  sourceIcon: { width: 27, height: 27, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  notebookIcon: { backgroundColor: '#F0EAFE' },
  walletIcon: { backgroundColor: '#FBE7F1' },
  sourceCopy: { flex: 1, minWidth: 0 },
  sourceLabel: { fontSize: 9, fontWeight: '700', color: '#948696' },
  sourceValue: { marginTop: 1, fontSize: 10, fontWeight: '800', color: '#443746', fontVariant: ['tabular-nums'] },
  insight: { marginTop: 8, minHeight: 34, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderRadius: 12, backgroundColor: '#F3EEFA' },
  insightWarning: { backgroundColor: '#FFF1E7' },
  insightText: { flex: 1, fontSize: 9, lineHeight: 13, fontWeight: '600', color: '#66546E' },
  insightWarningText: { color: '#925126' },
})
