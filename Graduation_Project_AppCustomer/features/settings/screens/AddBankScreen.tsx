import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { BankLogo } from '@/shared/components/BankLogo/BankLogo'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { COMMON_BANKS } from '@/shared/constants/commonBanks'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { linkBankAccount } from '@/shared/services'
import type { CommonBank } from '@/shared/types/bankAccount'
import { styles } from './AddBankScreen.styles'

const H_PADDING = 20
const COL_GAP = 10
const VISIBLE_COLS = 4

function buildBankColumns(banks: CommonBank[]) {
  const columns: CommonBank[][] = []
  for (let i = 0; i < banks.length; i += 2) {
    columns.push(banks.slice(i, i + 2))
  }
  return columns
}

export default function AddBankScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<CommonBank | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const itemWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width
    return (screenWidth - H_PADDING * 2 - COL_GAP * (VISIBLE_COLS - 1)) / VISIBLE_COLS
  }, [])

  const bankColumns = useMemo(() => buildBankColumns(COMMON_BANKS), [])

  const canSubmit = useMemo(
    () => !!selected && /^\d{6,20}$/.test(accountNumber.trim()),
    [selected, accountNumber],
  )

  async function handleSubmit() {
    if (!selected) {
      setError('Vui lòng chọn ngân hàng')
      return
    }
    if (!/^\d{6,20}$/.test(accountNumber.trim())) {
      setError('Số tài khoản phải gồm 6 đến 20 chữ số')
      return
    }

    setSaving(true)
    setError('')
    try {
      await linkBankAccount({
        bankCode: selected.code,
        bankName: selected.name,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || undefined,
      })
      showToast({ variant: 'success', message: 'Liên kết ngân hàng thành công!' })
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/settings/bank-binding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể liên kết ngân hàng')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Thêm ngân hàng</Text>
            <Text style={styles.subtitle}>Chọn ngân hàng và nhập số tài khoản</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Ngân hàng</Text>
        <Text style={styles.swipeHint}>Vuốt sang phải để xem thêm</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bankScrollContent}
          decelerationRate="fast"
        >
          {bankColumns.map((column, columnIndex) => (
            <View
              key={`col-${columnIndex}`}
              style={[
                styles.bankColumn,
                {
                  width: itemWidth,
                  marginRight: columnIndex === bankColumns.length - 1 ? 0 : COL_GAP,
                },
              ]}
            >
              {column.map((bank) => {
                const active = selected?.code === bank.code
                return (
                  <TouchableOpacity
                    key={bank.code}
                    style={[styles.bankItem, active && styles.bankItemActive]}
                    onPress={() => {
                      setSelected(bank)
                      if (error) setError('')
                    }}
                    activeOpacity={0.85}
                  >
                    <BankLogo uri={bank.logo} shortName={bank.shortName} size={36} />
                    <Text style={styles.bankShort} numberOfLines={1}>
                      {bank.shortName}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </ScrollView>

        <Text style={styles.label}>Số tài khoản</Text>
        <View style={[styles.inputBox, error ? styles.inputError : null]}>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tài khoản"
            placeholderTextColor={PASTEL_PALETTE.gray400}
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={(text) => {
              setAccountNumber(text.replace(/[^\d]/g, '').slice(0, 20))
              if (error) setError('')
            }}
          />
        </View>

        <Text style={styles.label}>Tên chủ tài khoản (tuỳ chọn)</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Để trống sẽ dùng tên đăng nhập"
            placeholderTextColor={PASTEL_PALETTE.gray400}
            autoCapitalize="characters"
            value={accountName}
            onChangeText={setAccountName}
            maxLength={150}
          />
        </View>

        <Text style={styles.hint}>
          Liên kết ảo — chưa kết nối cổng thanh toán thật. Dùng để chọn tài khoản khi rút tiền
          trong ví.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, (!canSubmit || saving) && styles.primaryBtnDisabled]}
          disabled={!canSubmit || saving}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Liên kết</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
