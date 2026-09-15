import { useRef, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { markPinSetupSuccessPending } from '@/features/auth/pinSetupSuccessFlag'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { axiosClient } from '@/shared/api/axiosClient'

const PIN_LENGTH = 6

export default function SetupPinScreen() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const currentPin = step === 'create' ? pin : confirmPin

  async function submitPin(finalPin: string) {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const res: any = await axiosClient.post('/api/v1/auth/setup-pin', {
        pinCode: finalPin,
      })
      if (res.success) {
        markPinSetupSuccessPending()
        router.replace('/(tabs)/home')
        return
      }
    } catch (err: any) {
      if (err?.code === 'AUTH_1014') {
        try {
          const status: any = await axiosClient.get('/api/v1/auth/pin-status')
          if (status?.data === true) {
            markPinSetupSuccessPending()
            router.replace('/(tabs)/home')
            return
          }
        } catch {
          // Fall through to the normal error message if PIN status cannot be verified.
        }
      }

      Alert.alert(
        'Lỗi',
        err?.message || 'Không thể cài đặt mã PIN. Vui lòng thử lại.',
      )
      setConfirmPin('')
      setPin('')
      setStep('create')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function handleKeyPress(key: string) {
    if (submitting) return

    if (key === 'backspace') {
      if (step === 'create') {
        setPin((prev) => prev.slice(0, -1))
      } else {
        setConfirmPin((prev) => prev.slice(0, -1))
      }
      if (error) setError('')
      return
    }

    if (step === 'create') {
      if (pin.length >= PIN_LENGTH) return
      const nextPin = pin + key
      setPin(nextPin)
      if (nextPin.length === PIN_LENGTH) {
        setTimeout(() => setStep('confirm'), 200)
      }
      return
    }

    if (confirmPin.length >= PIN_LENGTH) return
    const nextConfirm = confirmPin + key
    setConfirmPin(nextConfirm)
    if (nextConfirm.length === PIN_LENGTH) {
      if (nextConfirm === pin) {
        void submitPin(nextConfirm)
      } else {
        setError('Mã PIN không khớp. Vui lòng thử lại.')
        setConfirmPin('')
        setPin('')
        setStep('create')
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {step === 'create' ? 'Bước 1/2' : 'Bước 2/2'}
          </Text>
        </View>

        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>
            {step === 'create' ? 'Thiết lập mã PIN' : 'Xác nhận mã PIN'}
          </Text>
          <Text style={styles.pinSubtitle}>
            {step === 'create'
              ? 'Tạo mã PIN 6 số để xác thực các giao dịch quan trọng của bạn.'
              : 'Nhập lại mã PIN vừa tạo để xác nhận.'}
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={currentPin.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        <PinKeypad
          onPressKey={handleKeyPress}
          leftAction={
            step === 'confirm'
              ? {
                  label: 'Quay lại',
                  onPress: () => {
                    if (submitting) return
                    setConfirmPin('')
                    setError('')
                    setStep('create')
                  },
                }
              : undefined
          }
        />
      </View>
    </SafeAreaView>
  )
}
