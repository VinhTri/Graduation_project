import { useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { startForgotPinFlowSafe } from '@/features/auth/forgot-pin/startForgotPinFlow'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { axiosClient } from '@/shared/api/axiosClient'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

const PIN_LENGTH = 6

export default function VerifyPinScreen() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)

  async function submitPin(enteredPin: string) {
    setLoading(true)
    try {
      const res: any = await axiosClient.post('/api/v1/auth/verify-pin', {
        pinCode: enteredPin,
      })
      if (res.success) {
        router.replace('/(tabs)/home')
      } else {
        setError('Mã PIN không chính xác. Vui lòng thử lại.')
        setPin('')
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyPress(key: string) {
    if (loading || sendingOtp) return

    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1))
      if (error) setError('')
      return
    }

    if (pin.length >= PIN_LENGTH) return

    const nextPin = pin + key
    setPin(nextPin)

    if (nextPin.length === PIN_LENGTH) {
      submitPin(nextPin)
    }
  }

  async function handleForgotPin() {
    if (sendingOtp || loading) return
    setPin('')
    setError('')
    setSendingOtp(true)
    try {
      await startForgotPinFlowSafe(router)
    } finally {
      setSendingOtp(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Nhập mã PIN</Text>
          <Text style={styles.pinSubtitle}>
            Nhập mã PIN bảo mật 6 số để tiếp tục vào trang chính.
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={pin.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleForgotPin}
          disabled={sendingOtp || loading}
          style={{ alignItems: 'center', marginBottom: 8 }}
        >
          <Text
            style={{
              color: PASTEL_PALETTE.accentDeep,
              fontSize: 14,
              fontWeight: '700',
              opacity: sendingOtp ? 0.5 : 1,
            }}
          >
            {sendingOtp ? 'Đang gửi OTP...' : 'Quên mã PIN?'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.pinLoadingWrap}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <PinKeypad onPressKey={handleKeyPress} />
        )}
      </View>
    </SafeAreaView>
  )
}
