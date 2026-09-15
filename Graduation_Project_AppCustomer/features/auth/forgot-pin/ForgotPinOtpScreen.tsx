import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  clearForgotPinDraft,
  getForgotPinDraft,
  refreshForgotPinOtpExpiry,
  setForgotPinVerifiedOtp,
} from '@/features/auth/forgot-pin/forgotPinDraft'
import { useOtpCountdown } from '@/features/auth/hooks/useOtpCountdown'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { authService } from '@/shared/api/services/auth.service'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

const OTP_LENGTH = 6

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function ForgotPinOtpScreen() {
  const router = useRouter()
  const draft = getForgotPinDraft()
  const [email] = useState(draft?.email ?? '')
  const [expiresAt, setExpiresAt] = useState<number | null>(draft?.otpExpiresAt ?? null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const verifyingRef = useRef(false)
  const timeLeft = useOtpCountdown(expiresAt)

  useEffect(() => {
    if (!draft?.email) {
      router.replace('/(tabs)/home')
    }
  }, [draft?.email, router])

  async function verifyOtp(candidate: string) {
    if (!email) {
      verifyingRef.current = false
      setVerifying(false)
      return
    }
    if (timeLeft === 0) {
      setError('Mã OTP đã hết hạn, vui lòng gửi lại')
      setOtp('')
      verifyingRef.current = false
      setVerifying(false)
      return
    }

    setError('')
    try {
      await authService.verifyOtp({
        email,
        otp: candidate,
        purpose: 'RESET_PIN',
      })
      setForgotPinVerifiedOtp(candidate)
      router.replace('/forgot-pin/reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không chính xác')
      setOtp('')
    } finally {
      verifyingRef.current = false
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (resending || timeLeft > 0 || verifyingRef.current) return
    setResending(true)
    setError('')
    try {
      await authService.forgotPin()
      refreshForgotPinOtpExpiry()
      setExpiresAt(getForgotPinDraft()?.otpExpiresAt ?? null)
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại OTP')
    } finally {
      setResending(false)
    }
  }

  function handleKeyPress(key: string) {
    if (verifyingRef.current || resending) return

    if (key === 'backspace') {
      setOtp((prev) => prev.slice(0, -1))
      if (error) setError('')
      return
    }

    if (!/^\d$/.test(key)) return

    setOtp((prev) => {
      if (prev.length >= OTP_LENGTH) return prev
      const next = prev + key
      if (next.length === OTP_LENGTH) {
        verifyingRef.current = true
        setVerifying(true)
        setTimeout(() => {
          void verifyOtp(next)
        }, 0)
      }
      return next
    })
    if (error) setError('')
  }

  function handleBack() {
    if (verifyingRef.current) return
    clearForgotPinDraft()
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/home')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Bước 1/2</Text>
        </View>

        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Nhập mã OTP</Text>
          <Text style={styles.pinSubtitle}>
            Mã OTP 6 số đã gửi tới{'\n'}
            <Text style={{ color: PASTEL_PALETTE.accentDeep, fontWeight: '700' }}>
              {email || 'email của bạn'}
            </Text>
          </Text>
        </View>

        <PinDots length={OTP_LENGTH} filled={otp.length} />

        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}

        {verifying ? (
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <ActivityIndicator size="small" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : null}

        <Text
          style={{
            textAlign: 'center',
            fontSize: 15,
            fontWeight: '700',
            color: timeLeft <= 60 ? '#EF4444' : PASTEL_PALETTE.textMuted,
            marginBottom: 8,
          }}
        >
          {formatTime(timeLeft)}
        </Text>

        <TouchableOpacity
          onPress={handleResend}
          disabled={timeLeft > 0 || resending || verifying}
          style={{ alignItems: 'center', marginBottom: 8 }}
        >
          <Text
            style={{
              color: PASTEL_PALETTE.accentDeep,
              fontSize: 14,
              fontWeight: '700',
              opacity: timeLeft > 0 || resending ? 0.45 : 1,
            }}
          >
            {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
          </Text>
        </TouchableOpacity>

        <PinKeypad
          onPressKey={handleKeyPress}
          leftAction={{
            label: 'Quay lại',
            onPress: handleBack,
            disabled: verifying,
          }}
        />
      </View>
    </SafeAreaView>
  )
}
