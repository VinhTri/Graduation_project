import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  clearForgotPinDraft,
  getForgotPinDraft,
} from '@/features/auth/forgot-pin/forgotPinDraft'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { authService } from '@/shared/api/services/auth.service'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

const PIN_LENGTH = 6

export default function ForgotPinResetScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const draft = getForgotPinDraft()
  const leavingRef = useRef(false)

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (leavingRef.current) return
    if (!draft?.email || !draft?.otp) {
      router.replace('/forgot-pin/otp')
    }
  }, [draft?.email, draft?.otp, router])

  const currentPin = step === 'create' ? pin : confirmPin

  function leaveForgotPinFlow() {
    leavingRef.current = true
    // OTP đã replace bằng màn reset → back 1 lần về trang trước khi quên PIN.
    if (router.canGoBack()) {
      router.back()
    } else if (router.canDismiss()) {
      router.dismiss(1)
    } else {
      router.replace('/(tabs)/home')
    }
    clearForgotPinDraft()
  }

  function finishAndReturn() {
    showToast({
      variant: 'success',
      message: 'Đặt lại mã PIN thành công',
    })
    leaveForgotPinFlow()
  }

  async function submitNewPin(finalPin: string) {
    if (!draft?.otp) return

    setSubmitting(true)
    setError('')
    try {
      await authService.resetPin({
        otp: draft.otp,
        newPinCode: finalPin,
      })
      finishAndReturn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mã PIN')
      setPin('')
      setConfirmPin('')
      setStep('create')
    } finally {
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
      const next = pin + key
      setPin(next)
      if (next.length === PIN_LENGTH) {
        setTimeout(() => setStep('confirm'), 180)
      }
      return
    }

    if (confirmPin.length >= PIN_LENGTH) return
    const nextConfirm = confirmPin + key
    setConfirmPin(nextConfirm)
    if (nextConfirm.length === PIN_LENGTH) {
      if (nextConfirm !== pin) {
        setError('Mã PIN không khớp. Vui lòng nhập lại.')
        setConfirmPin('')
        return
      }
      submitNewPin(nextConfirm)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {step === 'create' ? 'Bước 2/2 · Tạo PIN' : 'Bước 2/2 · Xác nhận'}
          </Text>
        </View>

        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>
            {step === 'create' ? 'Đặt mã PIN mới' : 'Xác nhận mã PIN'}
          </Text>
          <Text style={styles.pinSubtitle}>
            {step === 'create'
              ? 'Tạo mã PIN 6 số mới để bảo vệ giao dịch của bạn.'
              : 'Nhập lại mã PIN vừa tạo để xác nhận.'}
          </Text>
        </View>

        <PinDots length={PIN_LENGTH} filled={currentPin.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        {submitting ? (
          <View style={styles.pinLoadingWrap}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <PinKeypad
            onPressKey={handleKeyPress}
            leftAction={{
              label: step === 'confirm' ? 'Quay lại' : 'Hủy',
              onPress: () => {
                if (step === 'confirm') {
                  setConfirmPin('')
                  setError('')
                  setStep('create')
                  return
                }
                leaveForgotPinFlow()
              },
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
