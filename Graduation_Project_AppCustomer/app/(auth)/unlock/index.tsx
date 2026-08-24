import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'
import { authService } from '@/shared/api/services/auth.service'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { finishAccountUnlockFlow } from '@/features/auth/accountLock'

const OTP_LENGTH = 6

export default function UnlockAccountScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ email?: string; autoSend?: string }>()
  const initialized = useRef(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    async function initialize() {
      if (initialized.current) return
      initialized.current = true
      const lockedEmail = await AsyncStorage.getItem('lockedAccountEmail')
      const sessionEmail = await AsyncStorage.getItem('userEmail')
      const storedEmail = params.email?.trim() || lockedEmail || sessionEmail
      if (!storedEmail) {
        router.replace('/(auth)/login')
        return
      }
      setEmail(storedEmail)

      const legacyShouldSend = await AsyncStorage.getItem('sendUnlockOtpOnOpen')
      if (params.autoSend === 'true' || legacyShouldSend === 'true') {
        await AsyncStorage.removeItem('sendUnlockOtpOnOpen')
        setResending(true)
        try {
          await authService.sendUnlockOtp(storedEmail)
          Alert.alert('Đã gửi OTP', 'Mã mở khóa đã được gửi đến Gmail của bạn.')
        } catch (err: any) {
          setError(err?.message || 'Không thể gửi mã OTP mở khóa')
        } finally {
          setResending(false)
        }
      }
    }
    void initialize()
  }, [params.autoSend, params.email, router])

  async function submit(candidate: string) {
    if (!email || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await authService.unlockAccount({ email, otp: candidate })
      finishAccountUnlockFlow()
      await AsyncStorage.removeItem('lockedAccountEmail')
      const token = await AsyncStorage.getItem('token')
      router.replace(token ? '/(tabs)/home' : '/(auth)/login')
    } catch (err: any) {
      const code = err?.code as string | undefined
      const message = code === 'AUTH_1008'
        ? 'Mã OTP đã hết hạn. Vui lòng bấm Gửi lại mã OTP.'
        : code === 'AUTH_1007'
          ? 'Mã OTP không chính xác. Vui lòng kiểm tra và nhập lại.'
          : err?.message || 'Không thể xác thực mã OTP'
      setError(message)
      Alert.alert('Xác thực không thành công', message)
      setOtp('')
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyPress(key: string) {
    if (submitting) return
    if (key === 'backspace') {
      setOtp((value) => value.slice(0, -1))
      setError('')
      return
    }
    setOtp((value) => {
      if (value.length >= OTP_LENGTH) return value
      const next = value + key
      if (next.length === OTP_LENGTH) setTimeout(() => void submit(next), 0)
      return next
    })
  }

  async function resend() {
    if (!email || resending) return
    setResending(true)
    setError('')
    try {
      await authService.sendUnlockOtp(email)
      Alert.alert('Đã gửi OTP', 'Mã mở khóa mới đã được gửi đến Gmail của bạn.')
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi lại OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.pinHeader}>
          <Text style={styles.pinTitle}>Mở khóa tài khoản</Text>
          <Text style={styles.pinSubtitle}>
            Nhập mã OTP 6 số đã gửi tới{email ? `\n${email}` : ' Gmail của bạn'}
          </Text>
        </View>

        <PinDots length={OTP_LENGTH} filled={otp.length} />
        {error ? <Text style={styles.pinErrorText}>{error}</Text> : null}
        {submitting ? <ActivityIndicator color={PASTEL_PALETTE.accentDeep} /> : null}

        <TouchableOpacity onPress={resend} disabled={resending || submitting}>
          <Text style={{ textAlign: 'center', color: PASTEL_PALETTE.accentDeep, fontWeight: '700' }}>
            {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </Text>
        </TouchableOpacity>

        <PinKeypad onPressKey={handleKeyPress} />
      </View>
    </SafeAreaView>
  )
}
