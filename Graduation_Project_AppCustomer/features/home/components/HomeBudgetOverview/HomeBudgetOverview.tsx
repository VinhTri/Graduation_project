import { useCallback, useMemo, useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { getBudgets } from '@/shared/services/budget.service'
import type { BudgetResponse, BudgetSourceSpend } from '@/shared/types/budget'
import { formatMoney, toSafeAmount } from '@/features/budget/utils/budgetFormat'
import { styles } from './HomeBudgetOverview.styles'

type BudgetMetric = {
  budget: BudgetResponse
  spent: number
  limit: number
  remaining: number
  ratio: number
}

function getTotalSpend(budget: BudgetResponse): BudgetSourceSpend {
  if (budget.total) return budget.total
  const spent = toSafeAmount(budget.notebook?.spent) + toSafeAmount(budget.wallet?.spent)
  const limit = toSafeAmount(budget.limitAmount)
  const remaining = limit - spent
  return { limitAmount: limit, spent, remaining, overLimit: remaining < 0 }
}

function toMetric(budget: BudgetResponse): BudgetMetric {
  const total = getTotalSpend(budget)
  const limit = toSafeAmount(total.limitAmount)
  const spent = toSafeAmount(total.spent)
  return {
    budget,
    spent,
    limit,
    remaining: limit - spent,
    ratio: limit > 0 ? spent / limit : 0,
  }
}

function riskColor(ratio: number) {
  if (ratio >= 1) return '#DC3F5F'
  if (ratio >= 0.9) return '#E95377'
  if (ratio >= 0.7) return '#D58A2B'
  return '#8B6BC7'
}

export function HomeBudgetOverview() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<BudgetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadedOnce = useRef(false)
  const appear = useRef(new Animated.Value(0)).current

  const load = useCallback(async () => {
    try {
      if (!loadedOnce.current) setLoading(true)
      const data = await getBudgets()
      setBudgets(data)
      setError('')
      loadedOnce.current = true
      Animated.timing(appear, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start()
    } catch (err) {
      if (!loadedOnce.current) {
        setError(err instanceof Error ? err.message : 'Không tải được ngân sách')
      }
    } finally {
      setLoading(false)
    }
  }, [appear])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const metrics = useMemo(
    () => budgets.filter((budget) => budget.status === 'ACTIVE').map(toMetric),
    [budgets],
  )
  const totalLimit = metrics.reduce((sum, item) => sum + item.limit, 0)
  const totalSpent = metrics.reduce((sum, item) => sum + item.spent, 0)
  const totalRemaining = totalLimit - totalSpent
  const totalRatio = totalLimit > 0 ? totalSpent / totalLimit : 0
  const topRisks = [...metrics]
    .sort((a, b) => b.ratio - a.ratio || b.spent - a.spent)
    .slice(0, 3)

  if (loading) {
    return (
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonValue} />
        <View style={styles.skeletonTrack} />
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRowShort} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.stateCard}>
        <View style={styles.stateIcon}><Ionicons name="cloud-offline-outline" size={22} color="#8B6BC7" /></View>
        <View style={styles.stateCopy}>
          <Text style={styles.stateTitle}>Chưa tải được ngân sách</Text>
          <Text style={styles.stateText} numberOfLines={2}>{error}</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={load} activeOpacity={0.75}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (metrics.length === 0) {
    const upcoming = budgets.find((budget) => budget.status === 'UPCOMING')
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyTopRow}>
          <View style={styles.emptyIcon}><Ionicons name="pie-chart-outline" size={22} color="#8B6BC7" /></View>
          <View style={styles.stateCopy}>
            <Text style={styles.stateTitle}>
              {upcoming ? 'Chưa đến kỳ ngân sách' : 'Bắt đầu kiểm soát chi tiêu'}
            </Text>
            <Text style={styles.stateText}>
              {upcoming
                ? `${upcoming.categoryName} bắt đầu từ ${new Date(`${upcoming.startDate}T00:00:00`).toLocaleDateString('vi-VN')}.`
                : 'Đặt giới hạn theo danh mục để biết khi nào cần chi tiêu chậm lại.'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => router.push(upcoming ? '/budget' : '/budget/create')}
          activeOpacity={0.78}
        >
          <Text style={styles.emptyActionText}>{upcoming ? 'Xem ngân sách' : 'Thiết lập ngân sách'}</Text>
          <Ionicons name="arrow-forward" size={16} color="#6D4AAF" />
        </TouchableOpacity>
      </View>
    )
  }

  const overallColor = riskColor(totalRatio)
  const progressWidth = `${Math.min(Math.max(totalRatio, 0), 1) * 100}%` as `${number}%`

  return (
    <Animated.View style={[styles.card, { opacity: appear }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Kế hoạch chi tiêu</Text>
          <Text style={styles.title}>Ngân sách đang hoạt động</Text>
        </View>
        <TouchableOpacity style={styles.viewAll} onPress={() => router.push('/budget')} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={15} color="#7655B4" />
        </TouchableOpacity>
      </View>

      <Text style={styles.amountLine}>
        <Text style={styles.amountStrong}>{formatMoney(totalSpent)}</Text>
        <Text style={styles.amountMuted}> / {formatMoney(totalLimit)}</Text>
      </Text>
      <View style={styles.overallTrack}>
        <View style={[styles.overallFill, { width: progressWidth, backgroundColor: overallColor }]} />
      </View>
      <View style={styles.remainingRow}>
        <Text style={styles.remainingLabel}>
          {totalRemaining < 0 ? 'Đã vượt kế hoạch' : 'Còn lại trong kế hoạch'}
        </Text>
        <Text style={[styles.remainingValue, { color: overallColor }]}>
          {formatMoney(Math.abs(totalRemaining))}
        </Text>
      </View>

      <View style={styles.riskList}>
        {topRisks.map((item) => {
          const color = riskColor(item.ratio)
          const width = `${Math.min(Math.max(item.ratio, 0), 1) * 100}%` as `${number}%`
          return (
            <TouchableOpacity
              key={item.budget.id}
              style={styles.riskRow}
              onPress={() => router.push({ pathname: '/budget/[id]', params: { id: String(item.budget.id) } })}
              activeOpacity={0.72}
            >
              <View style={[styles.categoryIcon, { backgroundColor: item.budget.categoryBgColor || '#F0E9FA' }]}>
                <Ionicons
                  name={(item.budget.categoryIcon as 'pie-chart-outline') || 'pie-chart-outline'}
                  size={17}
                  color={item.budget.categoryColor || '#7655B4'}
                />
              </View>
              <View style={styles.riskCopy}>
                <View style={styles.riskTopRow}>
                  <Text style={styles.categoryName} numberOfLines={1}>{item.budget.categoryName}</Text>
                  <Text style={[styles.percent, { color }]}>{Math.round(item.ratio * 100)}%</Text>
                </View>
                <View style={styles.miniTrack}><View style={[styles.miniFill, { width, backgroundColor: color }]} /></View>
                <Text style={[styles.categoryHint, item.remaining < 0 && styles.categoryHintOver]}>
                  {item.remaining < 0
                    ? `Vượt ${formatMoney(Math.abs(item.remaining))}`
                    : `Còn ${formatMoney(item.remaining)}`}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </Animated.View>
  )
}

export default HomeBudgetOverview
