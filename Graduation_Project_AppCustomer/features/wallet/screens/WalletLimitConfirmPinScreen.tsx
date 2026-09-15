import { useState } from 'react'
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { updateWalletSettings } from '@/shared/services'

const PIN_LENGTH = 6

function paramText(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default function WalletLimitConfirmPinScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const params = useLocalSearchParams<{
    walletId?: string
    enabled?: string
    transactionLimit?: string
    dailyLimit?: string
  }>()

  const walletId = Number(paramText(params.walletId))
  const enabled = paramText(params.enabled) === '1'
  const transactionLimit = paramText(params.transactionLimit)
  const dailyLimit = paramText(params.dailyLimit)

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function goBackToSettings() {
    if (router.canDismiss()) {
      router.dismissTo('/wallet/limit-settings')
    } else if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/wallet/limit-settings')
    }
  }

  async function handleConfirm(candidate: string) {
    if (!Number.isFinite(walletId) || walletId <= 0) {
      setError('Không tìm thấy ví cần cập nhật')
      setPin('')
      return
    }

    setBusy(true)
    setError('')
    try {
      await updateWalletSettings(walletId, {
        enabled,
        transactionLimit:
          enabled && transactionLimit ? Number(transactionLimit) : undefined,
        dailyLimit: enabled && dailyLimit ? Number(dailyLimit) : undefined,
        currentPinCode: candidate,
      })
      showToast({
        variant: 'success',
        message: enabled
          ? 'Đã lưu cài đặt hạn mức thành công'
          : 'Đã tắt thiết lập hạn mức giao dịch thành công',
      })
      goBackToSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực PIN thất bại')
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  function handleKeyPress(key: string) {
    if (busy) return
    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1))
      if (error) setError('')
      return
    }
    if (pin.length >= PIN_LENGTH) return
    const nextPin = pin + key
    setPin(nextPin)
    if (nextPin.length === PIN_LENGTH) {
      handleConfirm(nextPin)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>
            {enabled ? 'Xác nhận thiết lập hạn mức' : 'Xác nhận tắt hạn mức'}
          </Text>
          <Text style={styles.pinSubtitle}>
            {enabled
              ? 'Nhập mã PIN 6 số để lưu cài đặt hạn mức giao dịch cho ví SmartSpend.'
              : 'Nhập mã PIN 6 số để tắt thiết lập hạn mức giao dịch cho ví SmartSpend.'}
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={pin.length} />
        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}
        {busy ? (
          <View style={styles.pinLoadingWrap}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <PinKeypad
            onPressKey={handleKeyPress}
            leftAction={{
              label: 'Quay lại',
              onPress: () => {
                if (router.canGoBack()) router.back()
                else router.replace('/wallet/limit-settings')
              },
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
