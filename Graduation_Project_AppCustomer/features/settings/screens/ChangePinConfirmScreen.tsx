import { useEffect, useState } from 'react'
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { useChangeSecurityDraft } from '@/features/settings/context/ChangeSecurityContext'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { changePin } from '@/shared/services'

const PIN_LENGTH = 6

export default function ChangePinConfirmScreen() {
  const router = useRouter()
  const { currentPin, newPin, clearPinDraft } = useChangeSecurityDraft()
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!currentPin || !newPin) {
      router.replace('/settings/change-pin/current')
    }
  }, [currentPin, newPin, router])

  async function submitChange(finalPin: string) {
    setSubmitting(true)
    setError('')

    try {
      await changePin({
        currentPinCode: currentPin,
        newPinCode: newPin,
        confirmPinCode: finalPin,
      })
      clearPinDraft()
      router.replace({
        pathname: '/(tabs)/more',
        params: { securityToast: 'pin' },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đổi mã PIN'
      setConfirmPin('')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyPress(key: string) {
    if (submitting) return

    if (key === 'backspace') {
      setConfirmPin((prev) => prev.slice(0, -1))
      if (error) setError('')
      return
    }

    if (confirmPin.length >= PIN_LENGTH) return

    const nextPin = confirmPin + key
    setConfirmPin(nextPin)

    if (nextPin.length === PIN_LENGTH) {
      if (nextPin !== newPin) {
        setError('Mã PIN không khớp. Vui lòng thử lại.')
        setConfirmPin('')
        return
      }
      submitChange(nextPin)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Bước 3/3</Text>
        </View>

        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Nhập lại mã PIN mới</Text>
          <Text style={styles.pinSubtitle}>
            Xác nhận mã PIN mới để hoàn tất cập nhật bảo mật tài khoản.
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={confirmPin.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        {submitting ? (
          <View style={styles.pinLoadingWrap}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <PinKeypad
            onPressKey={handleKeyPress}
            leftAction={{
              label: 'Quay lại',
              disabled: submitting,
              onPress: () => router.back(),
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
