import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { deleteBudget, getBudget } from '@/shared/services/budget.service'
import type { BudgetResponse } from '@/shared/types/budget'
import { BudgetSpendBar } from '../components/BudgetSpendBar'
import { applyToLabel, BUDGET_SOURCE_LABEL } from '../constants/applyTo'
import { BUDGET_STATUS_META } from '../constants/status'
import { formatDisplayDate, formatMoney, toSafeAmount } from '../utils/budgetFormat'
import { navigateBackToBudgetList } from '../utils/navigation'
import { styles } from './budget.styles'

export default function BudgetDetailScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const budgetId = Number(id)

  const [budget, setBudget] = useState<BudgetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isFinite(budgetId)) {
      setError('Ngân sách không hợp lệ')
      setLoading(false)
      return
    }
    try {
      setError('')
      setBudget(await getBudget(budgetId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được ngân sách')
      setBudget(null)
    } finally {
      setLoading(false)
    }
  }, [budgetId])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load()
    }, [load]),
  )

  async function handleCancelBudget() {
    try {
      setCancelling(true)
      await deleteBudget(budgetId)
      showToast({ variant: 'success', message: 'Đã hủy hạn mức' })
      navigateBackToBudgetList(router)
    } catch (err) {
      showToast({
        variant: 'error',
        message: err instanceof Error ? err.message : 'Hủy hạn mức thất bại',
      })
    } finally {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  const statusMeta = budget ? BUDGET_STATUS_META[budget.status] : null
  const detailLimit = budget ? toSafeAmount(budget.limitAmount) : 0
  const detailSpent = budget
    ? budget.total
      ? toSafeAmount(budget.total.spent)
      : toSafeAmount(budget.notebook?.spent) + toSafeAmount(budget.wallet?.spent)
    : 0
  const detailRemaining = detailLimit - detailSpent
  const detailPercent = detailLimit > 0 ? Math.round((detailSpent / detailLimit) * 100) : 0
  const detailProgressWidth = `${Math.min(Math.max(detailPercent, 0), 100)}%` as `${number}%`
  const detailProgressColor = detailPercent >= 100 ? '#D9486F' : detailPercent >= 80 ? '#D9823D' : '#7655B4'

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.detailHeaderContent}>
        <View style={styles.detailHeaderRow}>
          <TouchableOpacity style={styles.detailHeaderBack} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={22} color="#6D4AAF" />
          </TouchableOpacity>
          <View style={styles.detailHeaderCopy}>
            <Text style={styles.detailHeaderEyebrow}>NGÂN SÁCH</Text>
            <Text style={styles.detailHeaderTitle}>Chi tiết hạn mức</Text>
            <Text style={styles.detailHeaderSubtitle}>Theo dõi tiến độ và phần còn lại</Text>
          </View>
          <View style={styles.detailHeaderMark}>
            <Ionicons name="analytics-outline" size={20} color="#6D4AAF" />
          </View>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : error || !budget || !statusMeta ? (
        <Text style={styles.errorText}>{error || 'Không tìm thấy ngân sách'}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHero}>
            <View
              style={[
                styles.detailIconWrap,
                { backgroundColor: budget.categoryBgColor || PASTEL_PALETTE.lavenderSoft },
              ]}
            >
              <Ionicons
                name={(budget.categoryIcon as 'pie-chart-outline') || 'pie-chart-outline'}
                size={28}
                color={budget.categoryColor || PASTEL_PALETTE.title}
              />
            </View>
            <View style={styles.detailHeroText}>
              <Text style={styles.detailCategoryName} numberOfLines={2}>
                {budget.categoryName}
              </Text>
              {budget.categoryGroupName ? (
                <Text style={styles.detailGroupName} numberOfLines={1}>
                  Nhóm · {budget.categoryGroupName}
                </Text>
              ) : null}
              {budget.categoryDeleted ? (
                <Text style={styles.detailDeletedHint}>Danh mục đã xóa</Text>
              ) : null}
            </View>
            <View style={[styles.detailStatusBadge, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.detailStatusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailLimitCard}>
            <View style={styles.detailLimitTop}>
              <View style={styles.detailLimitCopy}>
                <Text style={styles.detailLimitLabel}>
                  {detailRemaining < 0 ? 'Đã vượt hạn mức' : 'Bạn còn có thể chi'}
                </Text>
                <Text style={[styles.detailLimitValue, detailRemaining < 0 && styles.detailLimitValueOver]}>
                  {formatMoney(Math.abs(detailRemaining))}
                </Text>
              </View>
              <View style={[styles.detailPercentBadge, { backgroundColor: `${detailProgressColor}18` }]}>
                <Text style={[styles.detailPercentValue, { color: detailProgressColor }]}>{detailPercent}%</Text>
                <Text style={styles.detailPercentLabel}>đã dùng</Text>
              </View>
            </View>

            <View style={styles.detailProgressTrack}>
              <View
                style={[
                  styles.detailProgressFill,
                  { width: detailProgressWidth, backgroundColor: detailProgressColor },
                ]}
              />
            </View>

            <View style={styles.detailMoneyStats}>
              <View style={styles.detailMoneyStat}>
                <Text style={styles.detailMetaLabel}>Đã chi</Text>
                <Text style={styles.detailMoneyValue}>{formatMoney(detailSpent)}</Text>
              </View>
              <View style={styles.detailMetaDivider} />
              <View style={styles.detailMoneyStat}>
                <Text style={styles.detailMetaLabel}>Hạn mức</Text>
                <Text style={styles.detailMoneyValue}>{formatMoney(detailLimit)}</Text>
              </View>
            </View>

            <View style={styles.detailMetaRow}>
              <View style={styles.detailMetaItem}>
                <View style={styles.detailMetaIconRow}>
                  <Ionicons name="git-branch-outline" size={14} color="#806A89" />
                  <Text style={styles.detailMetaLabel}>Áp dụng</Text>
                </View>
                <Text style={styles.detailMetaValue}>{applyToLabel(budget.applyTo)}</Text>
              </View>
              <View style={styles.detailMetaDivider} />
              <View style={styles.detailMetaItem}>
                <View style={styles.detailMetaIconRow}>
                  <Ionicons name="calendar-clear-outline" size={14} color="#806A89" />
                  <Text style={styles.detailMetaLabel}>Kỳ hạn</Text>
                </View>
                <Text style={styles.detailMetaValue}>
                  {formatDisplayDate(budget.startDate)} – {formatDisplayDate(budget.endDate)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSpendSection}>
            <View style={styles.detailSectionHeading}>
              <View style={styles.detailSectionIcon}>
                <Ionicons name="layers-outline" size={16} color="#6D4AAF" />
              </View>
              <View>
                <Text style={styles.sectionLabel}>Chi tiêu theo nguồn</Text>
                <Text style={styles.detailSectionSubtitle}>Dữ liệu được cập nhật từ giao dịch đã ghi nhận</Text>
              </View>
            </View>
            {budget.total ? <BudgetSpendBar label="Tổng chi" spend={budget.total} /> : null}
            {budget.total && budget.applyTo === 'BOTH' ? (
              <Text style={styles.hint}>
                {BUDGET_SOURCE_LABEL.notebook}: {formatMoney(budget.notebook?.spent)} ·{' '}
                {BUDGET_SOURCE_LABEL.wallet}: {formatMoney(budget.wallet?.spent)}
              </Text>
            ) : null}
            {!budget.total && budget.notebook ? (
              <BudgetSpendBar label={BUDGET_SOURCE_LABEL.notebook} spend={budget.notebook} />
            ) : null}
            {!budget.total && budget.wallet ? (
              <BudgetSpendBar label={BUDGET_SOURCE_LABEL.wallet} spend={budget.wallet} />
            ) : null}
            {!budget.notebook && !budget.wallet ? (
              <Text style={styles.hint}>Chưa có nguồn chi tiêu được áp dụng.</Text>
            ) : null}
          </View>

          {((budget.total?.overLimit || toSafeAmount(budget.total?.remaining) < 0) ||
            (!budget.total && (budget.notebook?.overLimit ||
              budget.wallet?.overLimit ||
              toSafeAmount(budget.notebook?.remaining) < 0 ||
              toSafeAmount(budget.wallet?.remaining) < 0))) && (
            <Text style={[styles.errorField, { marginTop: 8 }]}>
              Đã vượt hạn mức — số còn lại có thể âm.
            </Text>
          )}

          <View style={styles.actionColumn}>
            {budget.status !== 'INVALIDATED' ? (
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() =>
                  router.push({
                    pathname: '/budget/[id]/edit',
                    params: { id: String(budget.id) },
                  })
                }
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color={PASTEL_PALETTE.white} />
                <Text style={styles.primaryActionText}>Cập nhật hạn mức</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.dangerOutlineBtn}
              onPress={() => setConfirmCancel(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.dangerOutlineText}>Hủy hạn mức</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <ConfirmModal
        visible={confirmCancel}
        title="Hủy hạn mức?"
        message="Ngân sách sẽ bị gỡ khỏi danh sách. Lịch sử chi tiêu vẫn giữ nguyên."
        confirmText="Hủy hạn mức"
        cancelText="Đóng"
        isDestructive
        onConfirm={handleCancelBudget}
        onCancel={() => {
          if (!cancelling) setConfirmCancel(false)
        }}
      />
    </View>
  )
}
