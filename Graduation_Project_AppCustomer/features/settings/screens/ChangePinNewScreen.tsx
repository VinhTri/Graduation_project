import { useEffect, useState } from 'react'
import { SafeAreaView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { useChangeSecurityDraft } from '@/features/settings/context/ChangeSecurityContext'

const PIN_LENGTH = 6

export default function ChangePinNewScreen() {
  const router = useRouter()
  const { currentPin, setNewPin } = useChangeSecurityDraft()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentPin) {
      router.replace('/settings/change-pin/current')
    }
  }, [currentPin, router])

  function handleKeyPress(key: string) {
    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1))
      if (error) setError('')
      return
    }

    if (pin.length >= PIN_LENGTH) return

    const nextPin = pin + key
    setPin(nextPin)

    if (nextPin.length === PIN_LENGTH) {
      if (nextPin === currentPin) {
        setError('Mã PIN mới phải khác mã PIN hiện tại.')
        setPin('')
        return
      }
      setNewPin(nextPin)
      setTimeout(() => {
        router.push('/settings/change-pin/confirm')
      }, 200)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Bước 2/3</Text>
        </View>

        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Nhập mã PIN mới</Text>
          <Text style={styles.pinSubtitle}>
            Tạo mã PIN 6 số mới để bảo vệ các giao dịch quan trọng.
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={pin.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        <PinKeypad
          onPressKey={handleKeyPress}
          leftAction={{
            label: 'Quay lại',
            onPress: () => router.back(),
          }}
        />
      </View>
    </SafeAreaView>
  )
}
