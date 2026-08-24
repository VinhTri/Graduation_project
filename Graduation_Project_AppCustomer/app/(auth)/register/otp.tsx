import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useRegisterDraft } from '@/features/auth/context/RegisterContext'
import { useOtpCountdown } from '@/features/auth/hooks/useOtpCountdown'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { authService } from '@/shared/api/services/auth.service'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { persistAuthSession } from '@/shared/services/session.service'

const OTP_LENGTH = 6

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function RegisterOtpScreen() {
  const router = useRouter()
  const { email, password, otpExpiresAt, startOtpCountdown } = useRegisterDraft()
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const verifyingRef = useRef(false)
  const timeLeft = useOtpCountdown(otpExpiresAt)

  useEffect(() => {
    if (!email || !password) {
      router.replace('/(auth)/register')
    }
  }, [email, password, router])

  useEffect(() => {
    if (!otpExpiresAt) {
      startOtpCountdown()
    }
  }, [otpExpiresAt, startOtpCountdown])

  async function handleResend() {
    if (resending || timeLeft > 0 || verifyingRef.current) return
    setResending(true)
    setOtpError('')
    try {
      await authService.sendRegisterOtp({ email })
      startOtpCountdown()
      setOtp('')
    } catch (error: any) {
      setOtpError(error?.message || 'Không thể gửi lại OTP')
    } finally {
      setResending(false)
    }
  }

  async function submitRegister(candidate: string) {
    if (timeLeft === 0) {
      setOtpError('Mã OTP đã hết hạn, vui lòng gửi lại')
      setOtp('')
      verifyingRef.current = false
      setLoading(false)
      return
    }

    setOtpError('')
    try {
      const response = await authService.register({
        email,
        password,
        otp: candidate,
      })

      if (response.data?.token) {
        await persistAuthSession({
          token: response.data.token,
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
        })
      }

      router.replace('/(auth)/success?mode=register')
    } catch (error: any) {
      const message = error?.message || 'Đăng ký thất bại'
      if (message.toLowerCase().includes('otp')) {
        setOtpError('Mã OTP không hợp lệ hoặc đã hết hạn')
      } else {
        setOtpError(message)
      }
      setOtp('')
    } finally {
      verifyingRef.current = false
      setLoading(false)
    }
  }

  function handleKeyPress(key: string) {
    if (verifyingRef.current || resending) return

    if (key === 'backspace') {
      setOtp((prev) => prev.slice(0, -1))
      if (otpError) setOtpError('')
      return
    }

    if (!/^\d$/.test(key)) return

    setOtp((prev) => {
      if (prev.length >= OTP_LENGTH) return prev
      const next = prev + key
      if (next.length === OTP_LENGTH) {
        verifyingRef.current = true
        setLoading(true)
        setTimeout(() => {
          void submitRegister(next)
        }, 0)
      }
      return next
    })
    if (otpError) setOtpError('')
  }

  function handleBack() {
    if (verifyingRef.current) return
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
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

        {otpError ? <Text style={styles.pinErrorText}>{otpError}</Text> : null}

        {loading ? (
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
          disabled={timeLeft > 0 || resending || loading}
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
            disabled: loading,
          }}
        />
      </View>
    </SafeAreaView>
  )
}
