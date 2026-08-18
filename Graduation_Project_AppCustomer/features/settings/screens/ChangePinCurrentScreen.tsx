import { useState } from 'react'
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { useChangeSecurityDraft } from '@/features/settings/context/ChangeSecurityContext'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { verifyCurrentPin } from '@/shared/services'

const PIN_LENGTH = 6

export default function ChangePinCurrentScreen() {
  const router = useRouter()
  const { setCurrentPin, clearPinDraft } = useChangeSecurityDraft()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function verifyPin(candidate: string) {
    setVerifying(true)
    setError('')

    try {
      await verifyCurrentPin({ currentPinCode: candidate })
      setCurrentPin(candidate)
      router.push('/settings/change-pin/new')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Mã PIN hiện tại không đúng!'
      setError(message)
      setPin('')
    } finally {
      setVerifying(false)
    }
  }

  function handleKeyPress(key: string) {
    if (verifying) return

    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1))
      if (error) setError('')
      return
    }

    if (pin.length >= PIN_LENGTH) return

    const nextPin = pin + key
    setPin(nextPin)

    if (nextPin.length === PIN_LENGTH) {
      verifyPin(nextPin)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Bước 1/3</Text>
        </View>

        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Nhập mã PIN hiện tại</Text>
          <Text style={styles.pinSubtitle}>
            Xác minh mã PIN 6 số đang dùng để bảo mật giao dịch của bạn.
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={pin.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        {verifying ? (
          <View style={styles.pinLoadingWrap}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <PinKeypad
            onPressKey={handleKeyPress}
            leftAction={{
              label: 'Quay lại',
              onPress: () => {
                clearPinDraft()
                if (router.canGoBack()) {
                  router.back()
                } else {
                  router.replace('/(tabs)/more')
                }
              },
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
