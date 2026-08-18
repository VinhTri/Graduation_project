import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { AddCategoryModal } from '@/features/categories/components/AddCategoryModal/AddCategoryModal'
import { CategorySelectModal } from '@/features/categories/components/CategorySelectModal/CategorySelectModal'
import { useCategories } from '@/features/categories/hooks/useCategories'
import type { SelectedCategory } from '@/features/notebook/types/transaction'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getDefaultWallet, topUpWallet } from '@/shared/services'
import { moneyFlowStyles as styles } from '../styles/moneyFlow.styles'

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000]
const MAX_NOTE = 100

function parseAmount(text: string) {
  const digits = text.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatInput(value: string) {
  const digits = value.replace(/[^\d]/g, '').slice(0, 12)
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

export default function TopUpScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { categories, loadCategories, addGroup, addItem } = useCategories({
    reloadOnFocus: false,
  })

  const [balance, setBalance] = useState(0)
  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<SelectedCategory | null>(null)
  const [amountError, setAmountError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    loadCategories()
    getDefaultWallet()
      .then((wallet) => setBalance(Number(wallet?.balance ?? 0)))
      .catch(() => undefined)
  }, [loadCategories])

  const amount = useMemo(() => parseAmount(amountText), [amountText])

  async function handleSubmit() {
    setAmountError('')
    setCategoryError('')
    setSubmitError('')

    if (amount < 1000) {
      setAmountError('Số tiền nạp tối thiểu là 1.000đ')
      return
    }
    if (!category) {
      setCategoryError('Vui lòng chọn danh mục')
      return
    }

    setSaving(true)
    try {
      await topUpWallet({
        amount,
        categoryId: category.id,
        note: note.trim() || undefined,
      })
      showToast({ variant: 'success', message: 'Nạp tiền thành công!' })
      if (router.canDismiss()) {
        router.dismissTo('/(tabs)/wallet')
      } else if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/(tabs)/wallet')
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể nạp tiền')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Nạp tiền</Text>
            <Text style={styles.subtitle}>
              Số dư hiện tại: {balance.toLocaleString('vi-VN')} ₫
            </Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Số tiền nạp</Text>
        <View style={[styles.inputBox, amountError ? styles.inputBoxError : null]}>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={PASTEL_PALETTE.gray400}
            keyboardType="number-pad"
            value={amountText}
            onChangeText={(text) => {
              setAmountText(formatInput(text))
              if (amountError) setAmountError('')
            }}
          />
          <Text style={styles.currency}>₫</Text>
        </View>
        {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}

        <View style={styles.chipRow}>
          {QUICK_AMOUNTS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, amount === value && styles.chipActive]}
              onPress={() => setAmountText(formatInput(String(value)))}
            >
              <Text style={[styles.chipText, amount === value && styles.chipTextActive]}>
                {value.toLocaleString('vi-VN')} ₫
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Danh mục</Text>
        <TouchableOpacity
          style={[styles.selector, categoryError ? styles.inputBoxError : null]}
          onPress={() => setSelectOpen(true)}
        >
          <Feather name="tag" size={18} color={PASTEL_PALETTE.accentDeep} />
          <Text style={styles.selectorText}>
            {category ? category.label : 'Chọn danh mục'}
          </Text>
          <Feather name="chevron-right" size={18} color={PASTEL_PALETTE.lavender} />
        </TouchableOpacity>
        {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

        <Text style={[styles.label, { marginTop: 14 }]}>Ghi chú</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.noteInput}
            placeholder="Ghi chú (tuỳ chọn)"
            placeholderTextColor={PASTEL_PALETTE.gray400}
            value={note}
            maxLength={MAX_NOTE}
            onChangeText={setNote}
          />
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Nạp tiền</Text>
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
          setCategoryError('')
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
    </View>
  )
}
