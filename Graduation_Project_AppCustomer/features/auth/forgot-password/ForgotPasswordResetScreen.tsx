import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import PasswordRequirementList from '@/features/auth/components/PasswordRequirementList'
import { isPasswordValid } from '@/features/auth/constants/registerValidation'
import {
  clearForgotPasswordDraft,
  getForgotPasswordDraft,
} from '@/features/auth/forgot-password/forgotPasswordDraft'
import ChangeSecurityShell from '@/features/settings/components/ChangeSecurityShell'
import { authService } from '@/shared/api/services/auth.service'
import { useToast } from '@/shared/components/Toast'
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors'
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles'

export default function ForgotPasswordResetScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const draft = getForgotPasswordDraft()
  const leavingRef = useRef(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (leavingRef.current) return
    if (!draft?.email || !draft?.otp) {
      router.replace('/settings/forgot-password/otp')
    }
  }, [draft?.email, draft?.otp, router])

  const passwordOk = isPasswordValid(password)
  const confirmOk = passwordOk && password === confirmPassword && confirmPassword.length > 0

  function leaveForgotPasswordFlow() {
    leavingRef.current = true
    if (router.canGoBack()) {
      router.back()
    } else if (router.canDismiss()) {
      router.dismiss(1)
    } else {
      router.replace('/settings/change-password/current')
    }
    clearForgotPasswordDraft()
  }

  async function handleSubmit() {
    setConfirmError('')
    setSubmitError('')

    if (!passwordOk) return

    if (!confirmPassword) {
      setConfirmError('Vui lòng xác nhận mật khẩu')
      return
    }

    if (password !== confirmPassword) {
      setConfirmError('Mật khẩu xác nhận không khớp')
      return
    }

    if (!draft?.email || !draft?.otp) {
      setSubmitError('Phiên OTP đã hết hạn, vui lòng thử lại')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({
        email: draft.email,
        otp: draft.otp,
        newPassword: password,
      })
      showToast({
        variant: 'success',
        message: 'Đặt lại mật khẩu thành công',
      })
      leaveForgotPasswordFlow()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChangeSecurityShell
      title="Đặt lại mật khẩu"
      subtitle="Tạo mật khẩu đăng nhập mới cho tài khoản"
      stepLabel="Bước 2/2"
      onBack={leaveForgotPasswordFlow}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu mới</Text>
        <View
          style={[
            styles.inputContainer,
            password.length > 0 && !passwordOk ? styles.inputContainerInvalid : null,
          ]}
        >
          <Feather name="lock" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Feather
              name={showPassword ? 'eye' : 'eye-off'}
              size={18}
              color={AUTH_INPUT_ICON}
            />
          </TouchableOpacity>
        </View>
        <PasswordRequirementList password={password} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
        <View
          style={[styles.inputContainer, confirmError ? { borderColor: '#EF4444' } : null]}
        >
          <Feather
            name="check-circle"
            size={18}
            color={AUTH_INPUT_ICON}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text)
              if (confirmError) setConfirmError('')
            }}
          />
          {confirmOk ? (
            <Feather name="check" size={20} color="#10B981" style={{ marginRight: 8 }} />
          ) : null}
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Feather
              name={showConfirmPassword ? 'eye' : 'eye-off'}
              size={18}
              color={AUTH_INPUT_ICON}
            />
          </TouchableOpacity>
        </View>
        {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
      </View>

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (loading || !passwordOk) && styles.primaryButtonDisabled,
        ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={loading || !passwordOk}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
        )}
      </TouchableOpacity>
    </ChangeSecurityShell>
  )
}
