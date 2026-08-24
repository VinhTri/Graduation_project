import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { transactionService } from '@/shared/api/services/transactionService'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getDefaultWallet } from '@/shared/services'
import { moneyFlowStyles as styles } from '../styles/moneyFlow.styles'

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000]
const MIN_TOP_UP = 1_000

function parseAmount(text: string) {
  const digits = text.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatInput(value: string) {
  const digits = value.replace(/[^\d]/g, '').slice(0, 12)
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

export default function TopUpScreen() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [amountText, setAmountText] = useState('')
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const amount = useMemo(() => parseAmount(amountText), [amountText])

  useEffect(() => {
    getDefaultWallet()
      .then((wallet) => setBalance(Number(wallet?.balance ?? 0)))
      .catch(() => setError('Không thể tải thông tin ví'))
      .finally(() => setLoadingBalance(false))
  }, [])

  function chooseAmount(value: number) {
    setAmountText(value.toLocaleString('vi-VN'))
    setError('')
  }

  async function handleTopUp() {
    setError('')
    if (amount < MIN_TOP_UP) {
      setError(`Số tiền nạp tối thiểu là ${MIN_TOP_UP.toLocaleString('vi-VN')} ₫`)
      return
    }

    try {
      setSaving(true)
      const result = await transactionService.initiateTopUp({ amount })
      router.replace({
        pathname: '/wallet/withdraw-success',
        params: {
          source: 'top-up',
          type: 'TOP_UP',
          transactionCode: result.transactionCode,
          amount: String(result.amount ?? amount),
          createdAt: result.createdAt,
          note: 'Nạp tiền vào ví',
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nạp tiền')
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
            <Text style={styles.subtitle}>Chọn số tiền để nạp trực tiếp vào ví</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.withdrawBalanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.withdrawBalanceIconWrap}>
              <Ionicons name="wallet-outline" size={22} color={PASTEL_PALETTE.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
              <Text style={styles.balanceValue}>
                {loadingBalance ? 'Đang tải...' : `${balance.toLocaleString('vi-VN')} ₫`}
              </Text>
            </View>
          </View>
          {amount > 0 ? (
            <View style={styles.withdrawBalanceMetaRow}>
              <Text style={styles.balanceMetaLabel}>Số dư sau khi nạp</Text>
              <Text style={styles.balanceMetaValue}>{(balance + amount).toLocaleString('vi-VN')} ₫</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.withdrawStepHeader}>
          <View style={styles.withdrawStepIndex}><Text style={styles.withdrawStepIndexText}>1</Text></View>
          <Text style={styles.withdrawStepTitle}>Nhập số tiền muốn nạp</Text>
        </View>
        <Text style={styles.withdrawFieldHint}>Tiền sẽ được cộng ngay để phục vụ kiểm thử.</Text>

        <View style={[styles.inputBox, !!error && styles.inputBoxError]}>
          <TextInput
            style={styles.amountInput}
            value={amountText}
            onChangeText={(value) => { setAmountText(formatInput(value)); setError('') }}
            placeholder="0"
            placeholderTextColor={PASTEL_PALETTE.gray400}
            keyboardType="number-pad"
            editable={!saving}
          />
          <Text style={styles.currency}>₫</Text>
        </View>

        <View style={styles.chipRow}>
          {QUICK_AMOUNTS.map((value) => {
            const active = amount === value
            return (
              <TouchableOpacity key={value} style={[styles.chip, active && styles.chipActive]} onPress={() => chooseAmount(value)} disabled={saving}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{value.toLocaleString('vi-VN')} ₫</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, (saving || amount <= 0) && styles.primaryBtnDisabled]}
          onPress={handleTopUp}
          disabled={saving || amount <= 0}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.withdrawButtonContent}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Nạp {amount > 0 ? `${amount.toLocaleString('vi-VN')} ₫` : 'tiền'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
