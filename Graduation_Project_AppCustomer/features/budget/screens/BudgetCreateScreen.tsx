import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AddCategoryModal } from '@/features/categories/components/AddCategoryModal/AddCategoryModal'
import { CategorySelectModal } from '@/features/categories/components/CategorySelectModal/CategorySelectModal'
import { useCategories } from '@/features/categories/hooks/useCategories'
import type { SelectedCategory } from '@/features/notebook/types/transaction'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { createBudget } from '@/shared/services/budget.service'
import type { BudgetApplyTo } from '@/shared/types/budget'
import { ApplyToPicker } from '../components/ApplyToPicker'
import {
  formatAmountInput,
  formatDisplayDate,
  parseAmountInput,
  startOfToday,
  clampToTodayOrLater,
  toIsoDate,
  weekEndFromStart,
} from '../utils/budgetFormat'
import { navigateBackToBudgetList } from '../utils/navigation'
import { styles } from './budget.styles'

type PeriodMode = 'week' | 'custom'
type PickerTarget = 'start' | 'end' | null

function paramText(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default function BudgetCreateScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const params = useLocalSearchParams<{
    categoryId?: string
    categoryLabel?: string
    categoryIcon?: string
    categoryColor?: string
    categoryBgColor?: string
  }>()
  const { categories, loadCategories, addGroup, addItem } = useCategories({
    reloadOnFocus: false,
  })

  const prefillCategory = useMemo<SelectedCategory | null>(() => {
    const id = Number(paramText(params.categoryId))
    const label = paramText(params.categoryLabel)
    if (!Number.isFinite(id) || id <= 0 || !label) return null
    return {
      id,
      label,
      icon: paramText(params.categoryIcon) || 'apps',
      color: paramText(params.categoryColor) || PASTEL_PALETTE.title,
      bgColor: paramText(params.categoryBgColor) || PASTEL_PALETTE.lavenderSoft,
    }
  }, [
    params.categoryId,
    params.categoryLabel,
    params.categoryIcon,
    params.categoryColor,
    params.categoryBgColor,
  ])

  const today = useMemo(() => startOfToday(), [])
  const [category, setCategory] = useState<SelectedCategory | null>(prefillCategory)
  const [applyTo, setApplyTo] = useState<BudgetApplyTo>('BOTH')
  const [amountText, setAmountText] = useState('')
  const [periodMode, setPeriodMode] = useState<PeriodMode>('week')
  const [startDate, setStartDate] = useState(() => startOfToday())
  const [endDate, setEndDate] = useState(() => weekEndFromStart(startOfToday()))
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)
  const [selectOpen, setSelectOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [dateError, setDateError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (prefillCategory) {
      setCategory(prefillCategory)
    }
  }, [prefillCategory])

  const amount = useMemo(() => parseAmountInput(amountText), [amountText])
  const minEndDate = startDate > today ? startDate : today

  function applyPeriodMode(mode: PeriodMode) {
    setPeriodMode(mode)
    if (mode === 'week') {
      setEndDate(weekEndFromStart(startDate))
    }
  }

  function applyPickedDate(date?: Date) {
    if (!date || !pickerTarget) return
    const safe = clampToTodayOrLater(date)
    if (pickerTarget === 'start') {
      setStartDate(safe)
      if (periodMode === 'week') {
        setEndDate(weekEndFromStart(safe))
      } else if (safe > endDate) {
        setEndDate(safe)
      }
    } else {
      const end = safe < startDate ? startDate : safe
      setEndDate(end)
    }
  }

  async function handleSubmit() {
    setCategoryError('')
    setAmountError('')
    setDateError('')
    setSubmitError('')

    if (!category) {
      setCategoryError('Vui lòng chọn danh mục')
      return
    }
    if (amount < 1000) {
      setAmountError('Hạn mức tối thiểu là 1.000đ')
      return
    }
    if (startDate < today) {
      setDateError('Ngày bắt đầu không được trong quá khứ')
      return
    }
    if (endDate < startDate) {
      setDateError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu')
      return
    }

    try {
      setSaving(true)
      await createBudget({
        categoryId: category.id,
        applyTo,
        limitAmount: amount,
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
      })
      showToast({ variant: 'success', message: 'Đã thiết lập ngân sách thành công' })
      navigateBackToBudgetList(router)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Tạo ngân sách thất bại')
    } finally {
      setSaving(false)
    }
  }

  const pickerValue = pickerTarget === 'end' ? endDate : startDate
  const pickerMinimum = pickerTarget === 'end' ? minEndDate : today
  const safePickerValue = pickerValue < pickerMinimum ? pickerMinimum : pickerValue

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Tạo ngân sách</Text>
            <Text style={styles.subtitle}>Ngày cố định sau khi tạo</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.sectionLabel}>Danh mục</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setSelectOpen(true)}
            activeOpacity={0.85}
          >
            {category ? (
              <>
                <View
                  style={[
                    styles.selectIcon,
                    { backgroundColor: category.bgColor || PASTEL_PALETTE.lavenderSoft },
                  ]}
                >
                  <Ionicons
                    name={(category.icon as 'apps') || 'apps'}
                    size={18}
                    color={category.color || PASTEL_PALETTE.title}
                  />
                </View>
                <Text style={styles.selectText}>{category.label}</Text>
              </>
            ) : (
              <Text style={[styles.selectText, styles.selectPlaceholder]}>
                Chọn danh mục
              </Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.textMuted} />
          </TouchableOpacity>
          {categoryError ? <Text style={styles.errorField}>{categoryError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.sectionLabel}>Áp dụng cho</Text>
          <ApplyToPicker value={applyTo} onChange={setApplyTo} />
        </View>

        <View style={styles.field}>
          <Text style={styles.sectionLabel}>Hạn mức</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={(text) => setAmountText(formatAmountInput(text))}
            keyboardType="number-pad"
            placeholder="Ví dụ: 300.000"
            placeholderTextColor={PASTEL_PALETTE.gray400}
          />
          {amountError ? <Text style={styles.errorField}>{amountError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.sectionLabel}>Kỳ hạn</Text>
          <View style={styles.periodRow}>
            <TouchableOpacity
              style={[styles.periodChip, periodMode === 'week' && styles.periodChipActive]}
              onPress={() => applyPeriodMode('week')}
            >
              <Text
                style={[
                  styles.periodChipText,
                  periodMode === 'week' && styles.periodChipTextActive,
                ]}
              >
                Tuần (+8 ngày)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodChip, periodMode === 'custom' && styles.periodChipActive]}
              onPress={() => applyPeriodMode('custom')}
            >
              <Text
                style={[
                  styles.periodChipText,
                  periodMode === 'custom' && styles.periodChipTextActive,
                ]}
              >
                Tùy chọn
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setPickerTarget('start')}
              activeOpacity={0.85}
            >
              <Text style={styles.dateLabel}>Từ ngày</Text>
              <Text style={styles.dateValue}>{formatDisplayDate(toIsoDate(startDate))}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateBtn, periodMode === 'week' && styles.dateBtnDisabled]}
              onPress={() => {
                if (periodMode === 'custom') setPickerTarget('end')
              }}
              activeOpacity={periodMode === 'custom' ? 0.85 : 1}
              disabled={periodMode === 'week'}
            >
              <Text style={styles.dateLabel}>Đến ngày</Text>
              <Text style={styles.dateValue}>{formatDisplayDate(toIsoDate(endDate))}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Chỉ chọn từ hôm nay trở đi. Sau khi tạo sẽ không đổi được khoảng ngày.
          </Text>
          {dateError ? <Text style={styles.errorField}>{dateError}</Text> : null}
        </View>

        {submitError ? <Text style={styles.errorField}>{submitError}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={PASTEL_PALETTE.white} />
          ) : (
            <Text style={styles.submitText}>Tạo ngân sách</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CategorySelectModal
        visible={selectOpen}
        categories={categories}
        onClose={() => setSelectOpen(false)}
        onSelect={(item) => {
          setCategory({
            id: item.id,
            label: item.label,
            icon: item.icon,
            color: item.color,
            bgColor: item.bgColor,
          })
          setSelectOpen(false)
        }}
        onAddCategory={() => {
          setSelectOpen(false)
          setCreateOpen(true)
        }}
      />

      <AddCategoryModal
        visible={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onBack={() => {
          setCreateOpen(false)
          setSelectOpen(true)
        }}
        onCreateGroup={addGroup}
        onSubmit={async (payload) => {
          await addItem(payload)
          await loadCategories()
          setCreateOpen(false)
          setSelectOpen(true)
        }}
      />

      {pickerTarget && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={safePickerValue}
          mode="date"
          display="default"
          minimumDate={pickerMinimum}
          onChange={(_, date) => {
            setPickerTarget(null)
            applyPickedDate(date)
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={!!pickerTarget} transparent animationType="slide">
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setPickerTarget(null)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>
                    {pickerTarget === 'end' ? 'Chọn ngày kết thúc' : 'Chọn ngày bắt đầu'}
                  </Text>
                  <TouchableOpacity onPress={() => setPickerTarget(null)}>
                    <Text style={styles.pickerDone}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <DateTimePicker
                    value={safePickerValue}
                    mode="date"
                    display="inline"
                    minimumDate={pickerMinimum}
                    onChange={(_, date) => applyPickedDate(date)}
                    locale="vi-VN"
                    themeVariant="light"
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </View>
  )
}
