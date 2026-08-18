import { useState } from 'react'
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { unlinkBankAccount, verifyCurrentPin } from '@/shared/services'

const PIN_LENGTH = 6

export default function UnlinkBankPinScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const params = useLocalSearchParams<{
    accountId?: string
    bankName?: string
  }>()
  const accountId = Number(params.accountId)
  const bankName = typeof params.bankName === 'string' ? params.bankName : 'ngân hàng'

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function goBackToBankList() {
    if (router.canDismiss()) {
      router.dismissTo('/settings/bank-binding')
    } else if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/settings/bank-binding')
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/settings/bank-binding')
    }
  }

  async function handleVerifyAndUnlink(candidate: string) {
    if (!Number.isFinite(accountId) || accountId <= 0) {
      setError('Không tìm thấy tài khoản cần hủy liên kết.')
      setPin('')
      return
    }

    setBusy(true)
    setError('')

    try {
      await verifyCurrentPin({ currentPinCode: candidate })
      await unlinkBankAccount(accountId)
      showToast({ variant: 'success', message: 'Đã hủy liên kết ngân hàng' })
      goBackToBankList()
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
      handleVerifyAndUnlink(nextPin)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Xác thực mã PIN</Text>
          <Text style={styles.pinSubtitle}>
            Nhập mã PIN 6 số để xác nhận hủy liên kết tài khoản {bankName}.
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
              onPress: goBack,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
