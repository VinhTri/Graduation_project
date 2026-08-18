import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { AddCategoryModal } from '@/features/categories/components/AddCategoryModal/AddCategoryModal'
import { CategorySelectModal } from '@/features/categories/components/CategorySelectModal/CategorySelectModal'
import { useCategories } from '@/features/categories/hooks/useCategories'
import type {
  InitialTransactionData,
  SelectedCategory,
  TransactionMode,
  TransactionPayload,
} from '../../types/transaction'
import { formatDateTime, stripDeletedCategorySuffix } from '../../utils/notebookMappers'
import { styles } from './AddTransactionModal.styles'

export type { InitialTransactionData, TransactionMode, TransactionPayload }

type FlowStep = 'form' | 'select' | 'create'

type Props = {
  visible: boolean
  mode: TransactionMode
  currentBalance?: number
  saving?: boolean
  initialData?: InitialTransactionData | null
  onClose: () => void
  onConfirm: (payload: TransactionPayload) => void | Promise<void>
}

const MAX_NOTE_LENGTH = 40
/** Tối đa 100 tỷ mỗi lần thu nhập / chi tiêu (đồng bộ BE). */
const MAX_TRANSACTION_AMOUNT = 100_000_000_000

export function AddTransactionModal({
  visible,
  mode,
  currentBalance = 0,
  saving = false,
  initialData,
  onClose,
  onConfirm,
}: Props) {
  const { categories, loadCategories, addGroup, addItem } = useCategories({
    reloadOnFocus: false,
  })

  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<SelectedCategory | null>(null)
  const [amountError, setAmountError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [focusedInput, setFocusedInput] = useState<'amount' | 'note' | null>(null)
  const [step, setStep] = useState<FlowStep>('form')

  const isSpend = mode === 'spend'
  const isEditMode = !!initialData

  useEffect(() => {
    if (!visible) {
      setStep('form')
      return
    }
    loadCategories()
    if (initialData) {
      setAmountText(formatInput(String(initialData.amount)))
      setNote(initialData.note || '')
      if (initialData.categoryId && initialData.categoryName) {
        const deleted = !!initialData.categoryDeleted
        setCategory({
          id: initialData.categoryId,
          label: stripDeletedCategorySuffix(initialData.categoryName),
          icon: initialData.categoryIcon || 'pricetag',
          color: initialData.categoryColor || PASTEL_PALETTE.accentDeep,
          deleted,
        })
      } else {
        setCategory(null)
      }
    } else {
      setAmountText('')
      setNote('')
      setCategory(null)
    }
    setAmountError('')
    setCategoryError('')
    setStep('form')
  }, [visible, mode, initialData, loadCategories])

  const handleConfirm = async () => {
    const amount = parseAmount(amountText)
    let hasError = false

    if (amount <= 0) {
      setAmountError('Vui lòng nhập số tiền lớn hơn 0')
      hasError = true
    } else if (amount > MAX_TRANSACTION_AMOUNT) {
      setAmountError('Số tiền tối đa mỗi lần nhập/rút là 100 tỷ')
      hasError = true
    } else if (isSpend && amount > currentBalance) {
      setAmountError('Số dư không đủ')
      hasError = true
    } else {
      setAmountError('')
    }

    if (!category) {
      setCategoryError('Vui lòng chọn danh mục')
      hasError = true
    } else if (category.deleted) {
      setCategoryError('Danh mục đã xóa, vui lòng chọn danh mục khác')
      hasError = true
    } else {
      setCategoryError('')
    }

    if (hasError) return

    try {
      await onConfirm({
        amount,
        note: note.trim() || undefined,
        category: category!,
      })
      onClose()
    } catch {
      // Parent shows alert; keep modal open
    }
  }

  return (
    <>
      <Modal
        visible={visible && step === 'form'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.iconWrap, isSpend && { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons
                    name={isSpend ? 'minus-circle-outline' : 'plus-circle-outline'}
                    size={24}
                    color={isSpend ? '#DC2626' : PASTEL_PALETTE.accentDeep}
                  />
                </View>
                <Text style={styles.title}>
                  {isEditMode
                    ? isSpend
                      ? 'Sửa chi tiêu'
                      : 'Sửa thu nhập'
                    : isSpend
                      ? 'Chi tiêu'
                      : 'Thu nhập'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
                <MaterialCommunityIcons name="close" size={24} color={PASTEL_PALETTE.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              {isEditMode && initialData?.createdAt
                ? formatDateTime(initialData.createdAt)
                : isSpend
                  ? 'Trừ tiền khỏi sổ tay và gắn danh mục chi tiêu.'
                  : 'Cộng tiền vào sổ tay và gắn danh mục thu nhập.'}
            </Text>

            <Text style={styles.label}>Số tiền</Text>
            <View
              style={[
                styles.amountInputContainer,
                focusedInput === 'amount' && styles.amountInputContainerFocused,
                !!amountError && styles.amountInputContainerError,
              ]}
            >
              <TextInput
                style={[
                  styles.amountInputText,
                  { color: isSpend ? '#DC2626' : PASTEL_PALETTE.accentDeep },
                ]}
                placeholder="0"
                placeholderTextColor={PASTEL_PALETTE.gray400}
                keyboardType="numeric"
                value={amountText}
                onFocus={() => setFocusedInput('amount')}
                onBlur={() => setFocusedInput(null)}
                onChangeText={(t) => {
                  setAmountText(formatInput(t))
                  if (amountError) setAmountError('')
                }}
              />
              <Text
                style={[
                  styles.currencySuffix,
                  { color: isSpend ? '#DC2626' : PASTEL_PALETTE.accentDeep },
                ]}
              >
                đ
              </Text>
            </View>
            {!!amountError && <Text style={styles.fieldError}>{amountError}</Text>}

            <Text style={[styles.label, { marginTop: 14 }]}>Chọn danh mục</Text>
            <TouchableOpacity
              style={[styles.selectInput, !!categoryError && styles.selectInputError]}
              activeOpacity={0.7}
              onPress={() => {
                setCategoryError('')
                setStep('select')
              }}
            >
              {category ? (
                <View style={styles.selectedCategory}>
                  <View
                    style={[
                      styles.smallIconContainer,
                      { backgroundColor: category.bgColor || `${category.color}22` },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={category.color}
                    />
                  </View>
                  <View style={styles.selectedCategoryText}>
                    <Text style={styles.selectTextValue} numberOfLines={1}>
                      {category.label}
                    </Text>
                    {category.deleted ? (
                      <Text style={styles.selectTextDeleted}>(đã xóa)</Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <Text style={styles.selectTextPlaceholder}>Chọn danh mục...</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={PASTEL_PALETTE.textMuted} />
            </TouchableOpacity>
            {!!categoryError && <Text style={styles.fieldError}>{categoryError}</Text>}

            <View style={styles.labelRow}>
              <Text style={[styles.label, { marginTop: 14, marginBottom: 0 }]}>
                Ghi chú
              </Text>
              <Text
                style={[
                  styles.charCount,
                  note.length >= MAX_NOTE_LENGTH && styles.charCountLimit,
                ]}
              >
                {note.length}/{MAX_NOTE_LENGTH}
              </Text>
            </View>
            <View style={[styles.inputWrap, focusedInput === 'note' && styles.inputFocused]}>
              <Feather
                name="edit-3"
                size={16}
                color={
                  focusedInput === 'note' ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textMuted
                }
              />
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor={PASTEL_PALETTE.textMuted}
                value={note}
                onFocus={() => setFocusedInput('note')}
                onBlur={() => setFocusedInput(null)}
                onChangeText={(t) => setNote(t.slice(0, MAX_NOTE_LENGTH))}
                maxLength={MAX_NOTE_LENGTH}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                isSpend && styles.primaryBtnSpend,
                saving && { opacity: 0.7 },
              ]}
              activeOpacity={0.8}
              disabled={saving}
              onPress={handleConfirm}
            >
              {saving ? (
                <ActivityIndicator color={PASTEL_PALETTE.white} />
              ) : (
                <>
                  <Ionicons
                    name={isEditMode ? 'save-outline' : isSpend ? 'remove-circle' : 'add-circle'}
                    size={20}
                    color={PASTEL_PALETTE.white}
                  />
                  <Text style={styles.primaryBtnText}>
                    {isEditMode
                      ? 'Lưu thay đổi'
                      : isSpend
                        ? 'Trừ khỏi sổ tay'
                        : 'Cộng vào sổ tay'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CategorySelectModal
        visible={visible && step === 'select'}
        categories={categories}
        onClose={() => setStep('form')}
        onSelect={(item) => {
          setCategory({
            id: item.id,
            label: item.label,
            icon: item.icon,
            color: item.color,
            bgColor: item.bgColor,
            deleted: false,
          })
          setCategoryError('')
          setStep('form')
        }}
        onAddCategory={() => setStep('create')}
      />

      <AddCategoryModal
        visible={visible && step === 'create'}
        categories={categories}
        onClose={() => setStep('select')}
        onBack={() => setStep('select')}
        onCreateGroup={addGroup}
        onSubmit={async (payload) => {
          await addItem(payload)
          await loadCategories()
        }}
      />
    </>
  )
}

function parseAmount(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return 0
  return Number(digits)
}

function formatInput(raw: string) {
  let digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  // Chặn vượt quá 100 tỷ khi gõ (tối đa 12 chữ số).
  if (digits.length > 12) digits = digits.slice(0, 12)
  const value = Number(digits)
  if (value > MAX_TRANSACTION_AMOUNT) {
    return MAX_TRANSACTION_AMOUNT.toLocaleString('vi-VN')
  }
  return value.toLocaleString('vi-VN')
}
