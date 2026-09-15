import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBudget, updateBudget } from '@/shared/services/budget.service'
import type { BudgetApplyTo, BudgetResponse } from '@/shared/types/budget'
import { ApplyToPicker } from '../components/ApplyToPicker'
import { BUDGET_STATUS_META } from '../constants/status'
import {
  formatAmountInput,
  formatDisplayDate,
  formatMoney,
  parseAmountInput,
  toSafeAmount,
} from '../utils/budgetFormat'
import { styles } from './budget.styles'

export default function BudgetEditScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const budgetId = Number(id)

  const [budget, setBudget] = useState<BudgetResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [applyTo, setApplyTo] = useState<BudgetApplyTo>('BOTH')
  const [amountText, setAmountText] = useState('')
  const [amountError, setAmountError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!Number.isFinite(budgetId)) {
      setError('Ngân sách không hợp lệ')
      setLoading(false)
      return
    }
    try {
      const data = await getBudget(budgetId)
      if (data.status === 'INVALIDATED') {
        setError('Ngân sách đã hết hiệu lực, không thể chỉnh sửa')
        setBudget(data)
        return
      }
      setBudget(data)
      setApplyTo(data.applyTo)
      setAmountText(formatAmountInput(String(Math.round(toSafeAmount(data.limitAmount)))))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được ngân sách')
    } finally {
      setLoading(false)
    }
  }, [budgetId])

  useEffect(() => {
    load()
  }, [load])

  const amount = useMemo(() => parseAmountInput(amountText), [amountText])
  const currentLimit = budget ? toSafeAmount(budget.limitAmount) : 0
  const limitChanged = amount > 0 && amount !== currentLimit
  const applyChanged = !!budget && applyTo !== budget.applyTo
  const canSubmit = amount >= 1000 && (limitChanged || applyChanged)

  async function handleSubmit() {
    setAmountError('')
    setSubmitError('')
    if (amount < 1000) {
      setAmountError('Hạn mức tối thiểu là 1.000đ')
      return
    }
    try {
      setSaving(true)
      await updateBudget(budgetId, { applyTo, limitAmount: amount })
      showToast({ variant: 'success', message: 'Đã cập nhật hạn mức' })
      router.back()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const statusMeta = budget ? BUDGET_STATUS_META[budget.status] : null

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Cập nhật hạn mức</Text>
            <Text style={styles.subtitle}>Chỉ đổi hạn mức & loại áp dụng</Text>
          </View>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : error || !budget || !statusMeta ? (
        <Text style={styles.errorText}>{error || 'Không tìm thấy ngân sách'}</Text>
      ) : budget.status === 'INVALIDATED' ? (
        <Text style={styles.errorText}>Ngân sách đã hết hiệu lực, không thể chỉnh sửa</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            </View>
            <View style={[styles.detailStatusBadge, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.detailStatusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.editLockedCard}>
            <View style={styles.editLockedRow}>
              <Ionicons name="calendar-outline" size={18} color={PASTEL_PALETTE.lavender} />
              <View style={styles.editLockedText}>
                <Text style={styles.editLockedLabel}>Kỳ hạn (không đổi)</Text>
                <Text style={styles.editLockedValue}>
                  {formatDisplayDate(budget.startDate)} – {formatDisplayDate(budget.endDate)}
                </Text>
              </View>
            </View>
            <View style={styles.editLockedDivider} />
            <View style={styles.editLockedRow}>
              <Ionicons name="wallet-outline" size={18} color={PASTEL_PALETTE.lavender} />
              <View style={styles.editLockedText}>
                <Text style={styles.editLockedLabel}>Hạn mức hiện tại</Text>
                <Text style={styles.editLockedValue}>{formatMoney(budget.limitAmount)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.sectionLabel}>Hạn mức mới</Text>
            <View style={[styles.editAmountBox, amountError ? styles.editAmountBoxError : null]}>
              <Text style={styles.editAmountPrefix}>₫</Text>
              <TextInput
                style={styles.editAmountInput}
                value={amountText}
                onChangeText={(text) => {
                  setAmountText(formatAmountInput(text))
                  if (amountError) setAmountError('')
                }}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={PASTEL_PALETTE.gray400}
              />
            </View>
            {amountError ? (
              <Text style={styles.errorField}>{amountError}</Text>
            ) : (
              <Text style={styles.hint}>Tối thiểu 1.000đ · có thể nâng hoặc hạ hạn mức</Text>
            )}
          </View>

          <View style={styles.editSection}>
            <Text style={styles.sectionLabel}>Áp dụng cho</Text>
            <ApplyToPicker value={applyTo} onChange={setApplyTo} />
          </View>

          {submitError ? <Text style={styles.errorField}>{submitError}</Text> : null}

          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              (!canSubmit || saving) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={PASTEL_PALETTE.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={PASTEL_PALETTE.white} />
                <Text style={styles.primaryActionText}>Cập nhật hạn mức</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  )
}
