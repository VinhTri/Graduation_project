import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal'
import PinModal from '@/shared/components/PinModal/PinModal'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { BankLogo } from '@/shared/components/BankLogo/BankLogo'
import { getBankMeta, getBankShortName } from '@/shared/constants/commonBanks'
import { PASTEL_HEADER_GRADIENT, PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBankAccounts, getDefaultWallet, withdrawWallet } from '@/shared/services'
import type { BankAccountResponse } from '@/shared/types/bankAccount'
import { WalletLimitPanel } from '../components/WalletLimitPanel'
import { moneyFlowStyles as styles } from '../styles/moneyFlow.styles'

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000]
const MAX_NOTE = 100
const DAILY_WARN_RATIO = 0.8
const MIN_WITHDRAW = 1000

function parseAmount(text: string) {
  const digits = text.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatInput(value: string) {
  const digits = value.replace(/[^\d]/g, '').slice(0, 12)
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

function maskAccount(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber
  return `•••• ${accountNumber.slice(-4)}`
}

function toLimitNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`
}

function dailyBelowMinMessage(remaining: number, percent: number) {
  if (remaining <= 0) {
    return `Bạn đã đạt ${percent}% hạn mức giao dịch trong ngày. Hôm nay bạn không còn hạn mức để rút.`
  }
  return `Bạn đã đạt ${percent}% hạn mức giao dịch trong ngày. Phần còn lại chỉ còn ${formatMoney(remaining)} — nhỏ hơn số tiền rút tối thiểu (${formatMoney(MIN_WITHDRAW)}), nên hôm nay không thể rút thêm.`
}

function dailyRemainingTooSmallError(remaining: number) {
  if (remaining <= 0) {
    return 'Bạn đã hết hạn mức giao dịch trong ngày'
  }
  return `Hạn mức ngày còn lại (${formatMoney(remaining)}) nhỏ hơn mức rút tối thiểu ${formatMoney(MIN_WITHDRAW)}`
}

export default function WithdrawScreen() {
  const router = useRouter()

  const [balance, setBalance] = useState(0)
  const [limitEnabled, setLimitEnabled] = useState(false)
  const [transactionLimit, setTransactionLimit] = useState<number | null>(null)
  const [dailyLimit, setDailyLimit] = useState<number | null>(null)
  const [dailyTransactedAmount, setDailyTransactedAmount] = useState(0)
  const [banks, setBanks] = useState<BankAccountResponse[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const [amountError, setAmountError] = useState('')
  const [bankError, setBankError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dailyWarnVisible, setDailyWarnVisible] = useState(false)
  const [dailyWarnMessage, setDailyWarnMessage] = useState('')
  const [pinVisible, setPinVisible] = useState(false)
  const [pinError, setPinError] = useState('')

  const entryWarnShownRef = useRef(false)
  const exceedModalShownRef = useRef(false)

  const remainingDaily = useMemo(() => {
    if (!limitEnabled || dailyLimit == null) return null
    return Math.max(0, dailyLimit - dailyTransactedAmount)
  }, [limitEnabled, dailyLimit, dailyTransactedAmount])

  const dailyUsageRatio = useMemo(() => {
    if (!limitEnabled || !dailyLimit || dailyLimit <= 0) return 0
    return dailyTransactedAmount / dailyLimit
  }, [limitEnabled, dailyLimit, dailyTransactedAmount])

  const dailyRemainingBelowMin =
    remainingDaily != null && remainingDaily < MIN_WITHDRAW

  const openDailyWarnModal = useCallback(
    (kind: 'entry' | 'exceed' | 'below_min') => {
      if (remainingDaily == null || dailyLimit == null) return
      const percent = Math.min(100, Math.round(dailyUsageRatio * 100))

      if (kind === 'below_min' || (kind !== 'exceed' && dailyRemainingBelowMin)) {
        setDailyWarnMessage(dailyBelowMinMessage(remainingDaily, percent))
      } else if (kind === 'entry') {
        setDailyWarnMessage(
          `Bạn đã đạt ${percent}% hạn mức giao dịch trong ngày. Bạn chỉ có thể rút tối đa ${formatMoney(remainingDaily)} trong hôm nay.`,
        )
      } else {
        setDailyWarnMessage(
          remainingDaily <= 0
            ? 'Bạn đã hết hạn mức giao dịch trong ngày. Hãy thử lại vào ngày mai hoặc điều chỉnh hạn mức ví.'
            : `Số tiền vượt quá hạn mức còn lại trong ngày. Bạn chỉ có thể rút tối đa ${formatMoney(remainingDaily)} hôm nay.`,
        )
      }
      setDailyWarnVisible(true)
    },
    [dailyLimit, dailyUsageRatio, remainingDaily, dailyRemainingBelowMin],
  )

  const loadWalletData = useCallback(async () => {
    try {
      const [wallet, accounts] = await Promise.all([getDefaultWallet(), getBankAccounts()])
      const nextEnabled = wallet?.limitStatus === 'ENABLED'
      const nextDaily = toLimitNumber(wallet?.dailyLimit)
      const nextUsed = Number(wallet?.dailyTransactedAmount ?? 0)

      setBalance(Number(wallet?.balance ?? 0))
      setLimitEnabled(nextEnabled)
      setTransactionLimit(toLimitNumber(wallet?.transactionLimit))
      setDailyLimit(nextDaily)
      setDailyTransactedAmount(nextUsed)
      setBanks(accounts)
      if (accounts.length > 0) {
        setSelectedBankId((prev) => prev ?? accounts[0].id)
      } else {
        setSelectedBankId(null)
      }

      if (!entryWarnShownRef.current && nextEnabled && nextDaily != null && nextDaily > 0) {
        const remaining = Math.max(0, nextDaily - nextUsed)
        const ratio = nextUsed / nextDaily
        const percent = Math.min(100, Math.round(ratio * 100))
        const belowMin = remaining < MIN_WITHDRAW

        if (belowMin || ratio >= DAILY_WARN_RATIO) {
          entryWarnShownRef.current = true
          setDailyWarnMessage(
            belowMin
              ? dailyBelowMinMessage(remaining, percent)
              : `Bạn đã đạt ${percent}% hạn mức giao dịch trong ngày. Bạn chỉ có thể rút tối đa ${formatMoney(remaining)} trong hôm nay.`,
          )
          setDailyWarnVisible(true)
        }
      }
    } catch {
      // keep current state
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadWalletData()
    }, [loadWalletData]),
  )

  const amount = useMemo(() => parseAmount(amountText), [amountText])
  const remaining = balance - amount
  const remainingOverdrawn = amount > 0 && remaining < 0

  const liveAmountError = useMemo(() => {
    if (amount <= 0) return ''
    if (dailyRemainingBelowMin && remainingDaily != null) {
      return dailyRemainingTooSmallError(remainingDaily)
    }
    if (amount > balance) return 'Số dư ví không đủ'
    if (limitEnabled && transactionLimit != null && amount > transactionLimit) {
      return 'Vượt quá hạn mức giao dịch đã thiết lập'
    }
    if (remainingDaily != null && amount > remainingDaily) {
      return remainingDaily <= 0
        ? 'Bạn đã hết hạn mức giao dịch trong ngày'
        : `Vượt quá hạn mức ngày. Chỉ còn rút được ${formatMoney(remainingDaily)}`
    }
    if (amount < MIN_WITHDRAW) {
      return `Số tiền rút tối thiểu là ${formatMoney(MIN_WITHDRAW)}`
    }
    return ''
  }, [
    amount,
    balance,
    limitEnabled,
    transactionLimit,
    remainingDaily,
    dailyRemainingBelowMin,
  ])

  useEffect(() => {
    if (amount <= 0 || remainingDaily == null) {
      exceedModalShownRef.current = false
      return
    }
    const shouldWarn =
      dailyRemainingBelowMin || amount > remainingDaily
    if (shouldWarn) {
      if (!exceedModalShownRef.current) {
        exceedModalShownRef.current = true
        openDailyWarnModal(dailyRemainingBelowMin ? 'below_min' : 'exceed')
      }
      return
    }
    exceedModalShownRef.current = false
  }, [amount, remainingDaily, dailyRemainingBelowMin, openDailyWarnModal])

  function handleAmountChange(text: string) {
    setAmountText(formatInput(text))
    if (amountError) setAmountError('')
    if (submitError) setSubmitError('')
  }

  async function handleSubmit() {
    setAmountError('')
    setBankError('')
    setSubmitError('')
    setPinError('')

    if (dailyRemainingBelowMin && remainingDaily != null) {
      setAmountError(dailyRemainingTooSmallError(remainingDaily))
      openDailyWarnModal('below_min')
      return
    }
    if (amount < MIN_WITHDRAW) {
      setAmountError(`Số tiền rút tối thiểu là ${formatMoney(MIN_WITHDRAW)}`)
      return
    }
    if (amount > balance) {
      setAmountError('Số dư ví không đủ')
      return
    }
    if (limitEnabled && transactionLimit != null && amount > transactionLimit) {
      setAmountError('Vượt quá hạn mức giao dịch đã thiết lập')
      return
    }
    if (remainingDaily != null && amount > remainingDaily) {
      setAmountError(
        remainingDaily <= 0
          ? 'Bạn đã hết hạn mức giao dịch trong ngày'
          : `Vượt quá hạn mức ngày. Chỉ còn rút được ${formatMoney(remainingDaily)}`,
      )
      openDailyWarnModal('exceed')
      return
    }
    if (!selectedBankId) {
      setBankError('Vui lòng chọn tài khoản ngân hàng đã liên kết')
      return
    }

    setPinVisible(true)
  }

  async function handlePinConfirm(pinCode: string) {
    if (!selectedBankId) return

    setSaving(true)
    setPinError('')
    try {
      const selectedBank = banks.find((bank) => bank.id === selectedBankId)
      const tx = await withdrawWallet({
        amount,
        bankAccountId: selectedBankId,
        pinCode,
        note: note.trim() || undefined,
      })

      setPinVisible(false)
      router.replace({
        pathname: '/wallet/withdraw-success',
        params: {
          source: 'withdraw',
          type: 'WITHDRAW',
          transactionCode: tx.transactionCode,
          amount: String(tx.amount),
          createdAt: tx.createdAt,
          bankName: tx.bankName ?? selectedBank?.bankName ?? '',
          bankCode: tx.bankCode ?? selectedBank?.bankCode ?? '',
          bankAccountNumber: tx.bankAccountNumber ?? selectedBank?.accountNumber ?? '',
          accountName: tx.bankAccountName ?? selectedBank?.accountName ?? '',
          categoryId: tx.categoryId != null ? String(tx.categoryId) : '',
          categoryName: tx.categoryName ?? '',
          categoryIcon: tx.categoryIcon ?? '',
          categoryColor: tx.categoryColor ?? '',
          categoryBgColor: tx.categoryBgColor ?? '',
          note: tx.note ?? note.trim(),
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể rút tiền'
      const isLimitError =
        message.includes('WALL_2010') ||
        message.includes('WALL_2011') ||
        message.includes('hạn mức giao dịch trong ngày') ||
        message.includes('hạn mức giao dịch đã thiết lập')

      if (isLimitError) {
        setPinVisible(false)
        setSubmitError(message)
        openDailyWarnModal(dailyRemainingBelowMin ? 'below_min' : 'exceed')
      } else {
        // Lỗi PIN / khác → chỉ hiện trong PinModal, không hiện dưới ô ghi chú
        setPinError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  const displayAmountError = amountError || liveAmountError

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Rút tiền</Text>
            <Text style={styles.subtitle}>Chuyển về tài khoản đã liên kết</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[...PASTEL_HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceDecor} />
          <View style={styles.balanceDecorSmall} />
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceIconWrap}>
              <Ionicons name="wallet-outline" size={22} color={PASTEL_PALETTE.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
              <Text style={styles.balanceValue}>{balance.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
          {amount > 0 ? (
            <View style={styles.balanceMetaRow}>
              <Text style={styles.balanceMetaLabel}>
                {remainingOverdrawn ? 'Vượt quá số dư' : 'Còn lại sau khi rút'}
              </Text>
              <Text
                style={[
                  styles.balanceMetaValue,
                  remainingOverdrawn ? styles.balanceMetaWarn : null,
                ]}
              >
                {remaining.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          ) : null}

          <WalletLimitPanel
            enabled={limitEnabled}
            transactionLimit={transactionLimit}
            dailyLimit={dailyLimit}
            dailyTransactedAmount={dailyTransactedAmount}
            withdrawAmount={amount}
          />
        </LinearGradient>

        <Text style={styles.label}>Số tiền rút</Text>
        <View style={[styles.inputBox, displayAmountError ? styles.inputBoxError : null]}>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={PASTEL_PALETTE.gray400}
            keyboardType="number-pad"
            value={amountText}
            onChangeText={handleAmountChange}
          />
          <Text style={styles.currency}>₫</Text>
        </View>
        {displayAmountError ? <Text style={styles.errorText}>{displayAmountError}</Text> : null}

        <View style={styles.chipRow}>
          {QUICK_AMOUNTS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, amount === value && styles.chipActive]}
              onPress={() => handleAmountChange(String(value))}
            >
              <Text style={[styles.chipText, amount === value && styles.chipTextActive]}>
                {value.toLocaleString('vi-VN')} ₫
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tài khoản nhận</Text>
        {banks.length === 0 ? (
          <View style={styles.emptyBankBox}>
            <Text style={styles.emptyBankText}>
              Bạn chưa liên kết ngân hàng. Hãy liên kết tài khoản để rút tiền.
            </Text>
            <TouchableOpacity
              style={styles.linkBankBtn}
              onPress={() => router.push('/settings/bank-binding/add')}
            >
              <Text style={styles.linkBankText}>Liên kết ngân hàng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {banks.map((bank) => {
              const active = selectedBankId === bank.id
              const meta = getBankMeta(bank.bankCode)
              return (
                <TouchableOpacity
                  key={bank.id}
                  style={[styles.bankCard, active && styles.bankCardActive]}
                  onPress={() => {
                    setSelectedBankId(bank.id)
                    if (bankError) setBankError('')
                  }}
                >
                  <BankLogo
                    uri={meta?.logo}
                    shortName={getBankShortName(bank.bankCode, bank.bankName)}
                    size={40}
                    style={styles.bankLogo}
                  />
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName} numberOfLines={1}>
                      {bank.bankName}
                    </Text>
                    <Text style={styles.bankAccount} numberOfLines={1}>
                      {bank.accountName}
                    </Text>
                    <Text style={styles.bankAccount} numberOfLines={1}>
                      {maskAccount(bank.accountNumber)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}
        {bankError ? <Text style={styles.errorText}>{bankError}</Text> : null}

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
          style={[
            styles.primaryBtn,
            (saving || dailyRemainingBelowMin) && styles.primaryBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={saving || dailyRemainingBelowMin}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Rút tiền</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={dailyWarnVisible}
        title="Cảnh báo hạn mức ngày"
        message={dailyWarnMessage}
        confirmText="Đã hiểu"
        hideCancel
        image={require('../../../assets/images/daily-limit-warning.png')}
        imageAspectRatio={1}
        isDestructive={false}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={() => setDailyWarnVisible(false)}
        onCancel={() => setDailyWarnVisible(false)}
      />

      <PinModal
        visible={pinVisible}
        onClose={() => {
          if (saving) return
          setPinVisible(false)
          setPinError('')
        }}
        onConfirm={handlePinConfirm}
        errorMessage={pinError}
        title="Xác nhận rút tiền"
        subtitle="Nhập mã PIN 6 số để xác nhận giao dịch rút về ngân hàng."
      />
    </View>
  )
}
