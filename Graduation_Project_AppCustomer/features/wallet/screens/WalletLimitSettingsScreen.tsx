import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getDefaultWallet } from '@/shared/services'
import type { WalletResponse } from '@/shared/types/wallet'
import { styles } from './WalletLimitSettingsScreen.styles'

function digitsOnly(text: string) {
  return text.replace(/[^\d]/g, '').slice(0, 12)
}

function formatDisplay(val: string) {
  if (!val) return ''
  return Number(val).toLocaleString('vi-VN')
}

function toAmountString(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return ''
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 ? String(n) : ''
}

export default function WalletLimitSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [fetching, setFetching] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [transactionLimit, setTransactionLimit] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  const [saved, setSaved] = useState({
    enabled: false,
    transactionLimit: '',
    dailyLimit: '',
  })
  const [dailyTransacted, setDailyTransacted] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [attemptedSave, setAttemptedSave] = useState(false)

  const load = useCallback(async () => {
    try {
      setFetching(true)
      const data = await getDefaultWallet()
      if (!data) {
        setLoadError('Không tìm thấy ví SmartSpend')
        return
      }
      const nextEnabled = data.limitStatus === 'ENABLED'
      const nextTx = toAmountString(data.transactionLimit)
      const nextDaily = toAmountString(data.dailyLimit)
      setWallet(data)
      setEnabled(nextEnabled)
      setTransactionLimit(nextTx)
      setDailyLimit(nextDaily)
      setSaved({ enabled: nextEnabled, transactionLimit: nextTx, dailyLimit: nextDaily })
      setDailyTransacted(Number(data.dailyTransactedAmount ?? 0))
      setLoadError('')
      setAttemptedSave(false)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được cấu hình ví')
    } finally {
      setFetching(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const txAmount = transactionLimit ? Number(transactionLimit) : 0
  const dayAmount = dailyLimit ? Number(dailyLimit) : 0
  const bothEmpty = enabled && !txAmount && !dayAmount
  const txExceedsDaily = enabled && txAmount > 0 && dayAmount > 0 && txAmount > dayAmount

  const transactionLimitError = useMemo(() => {
    if (!enabled) return ''
    if (txExceedsDaily) {
      return 'Không được lớn hơn hạn mức ngày'
    }
    if (attemptedSave && bothEmpty) {
      return 'Nhập ít nhất một hạn mức'
    }
    return ''
  }, [enabled, txExceedsDaily, attemptedSave, bothEmpty])

  const dailyLimitError = useMemo(() => {
    if (!enabled) return ''
    if (txExceedsDaily) {
      return 'Phải lớn hơn hoặc bằng hạn mức mỗi giao dịch'
    }
    if (attemptedSave && bothEmpty) {
      return 'Nhập ít nhất một hạn mức'
    }
    return ''
  }, [enabled, txExceedsDaily, attemptedSave, bothEmpty])

  const hasChanges =
    enabled !== saved.enabled ||
    transactionLimit !== saved.transactionLimit ||
    dailyLimit !== saved.dailyLimit

  const progress = useMemo(() => {
    if (dayAmount <= 0) return 0
    return Math.min((dailyTransacted / dayAmount) * 100, 100)
  }, [dayAmount, dailyTransacted])

  function handleToggle(next: boolean) {
    setAttemptedSave(false)
    if (!next && saved.enabled) {
      router.push({
        pathname: '/wallet/limit-settings/confirm-pin',
        params: {
          walletId: String(wallet?.id ?? ''),
          enabled: '0',
        },
      })
      return
    }
    setEnabled(next)
  }

  function handleSave() {
    setAttemptedSave(true)
    if (!wallet?.id) {
      setLoadError('Không xác định được ví')
      return
    }
    if (enabled && (bothEmpty || txExceedsDaily)) {
      return
    }

    router.push({
      pathname: '/wallet/limit-settings/confirm-pin',
      params: {
        walletId: String(wallet.id),
        enabled: enabled ? '1' : '0',
        transactionLimit: enabled ? transactionLimit : '',
        dailyLimit: enabled ? dailyLimit : '',
      },
    })
  }

  const saveDisabled = !hasChanges || fetching

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thiết lập hạn mức ví</Text>
        </View>
      </PastelHeaderShell>

      {fetching ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Quản lý hạn mức</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLabelContainer}>
                  <Text style={styles.rowTitle}>Thiết lập hạn mức giao dịch</Text>
                  <Text style={styles.rowSubtitle}>
                    Giới hạn số tiền tối đa cho mỗi giao dịch và tổng giao dịch trong ngày
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: PASTEL_PALETTE.border, true: PASTEL_PALETTE.accentSoft }}
                  thumbColor={enabled ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.white}
                  ios_backgroundColor={PASTEL_PALETTE.border}
                />
              </View>

              {enabled ? (
                <View>
                  <View style={styles.divider} />
                  <Text style={styles.rowTitle}>Tối đa mỗi lần giao dịch</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      transactionLimitError ? styles.inputContainerError : null,
                    ]}
                  >
                    <Text style={styles.currencySymbol}>₫</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={formatDisplay(transactionLimit)}
                      onChangeText={(text) => setTransactionLimit(digitsOnly(text))}
                      placeholder="VD: 5.000.000"
                      placeholderTextColor={PASTEL_PALETTE.gray400}
                    />
                  </View>
                  {transactionLimitError ? (
                    <Text style={styles.fieldError}>{transactionLimitError}</Text>
                  ) : null}

                  <View style={{ height: 14 }} />
                  <Text style={styles.rowTitle}>Tối đa tổng cả ngày</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      dailyLimitError ? styles.inputContainerError : null,
                    ]}
                  >
                    <Text style={styles.currencySymbol}>₫</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={formatDisplay(dailyLimit)}
                      onChangeText={(text) => setDailyLimit(digitsOnly(text))}
                      placeholder="VD: 20.000.000"
                      placeholderTextColor={PASTEL_PALETTE.gray400}
                    />
                  </View>
                  {dailyLimitError ? (
                    <Text style={styles.fieldError}>{dailyLimitError}</Text>
                  ) : null}

                  <View style={styles.divider} />
                  <View style={styles.statsRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statLabel}>Đã giao dịch trong ngày</Text>
                      <Text style={styles.statValue}>
                        {dailyTransacted.toLocaleString('vi-VN')} ₫
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.statLabel}>Hạn mức còn lại</Text>
                      <Text style={styles.statValue}>
                        {dayAmount > 0
                          ? Math.max(0, dayAmount - dailyTransacted).toLocaleString('vi-VN')
                          : '0'}{' '}
                        ₫
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%` },
                        progress >= 100 ? styles.progressFillOver : null,
                      ]}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.infoSection}>
              <Ionicons name="information-circle" size={22} color={PASTEL_PALETTE.accentDeep} />
              <Text style={styles.infoText}>
                Tính năng thiết lập hạn mức giúp bạn kiểm soát chi tiêu tốt hơn.
              </Text>
            </View>

            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
              disabled={saveDisabled}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.saveButtonText, saveDisabled && styles.saveButtonTextDisabled]}
              >
                Lưu thay đổi
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  )
}
