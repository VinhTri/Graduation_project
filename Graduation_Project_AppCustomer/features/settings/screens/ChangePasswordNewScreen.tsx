import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import PasswordRequirementList from '@/features/auth/components/PasswordRequirementList'
import { isPasswordValid } from '@/features/auth/constants/registerValidation'
import ChangeSecurityShell from '@/features/settings/components/ChangeSecurityShell'
import { useChangeSecurityDraft } from '@/features/settings/context/ChangeSecurityContext'
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors'
import { changePassword } from '@/shared/services'
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles'

export default function ChangePasswordNewScreen() {
  const router = useRouter()
  const { currentPassword, clearPasswordDraft } = useChangeSecurityDraft()
  const [value, setValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentPassword) {
      router.replace('/settings/change-password/current')
    }
  }, [currentPassword, router])

  const passwordOk = isPasswordValid(value)
  const confirmOk = passwordOk && value === confirmPassword && confirmPassword.length > 0

  async function handleSubmit() {
    setConfirmError('')
    setSubmitError('')

    if (!passwordOk) return

    if (!confirmPassword) {
      setConfirmError('Vui lòng xác nhận mật khẩu')
      return
    }

    if (value !== confirmPassword) {
      setConfirmError('Mật khẩu xác nhận không khớp')
      return
    }

    if (value === currentPassword) {
      setSubmitError('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    setLoading(true)
    try {
      await changePassword({
        currentPassword,
        newPassword: value,
        confirmPassword,
      })
      clearPasswordDraft()
      router.replace({
        pathname: '/(tabs)/more',
        params: { securityToast: 'password' },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu'
      setSubmitError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChangeSecurityShell
      title="Mật khẩu mới"
      subtitle="Tạo mật khẩu đăng nhập mới cho tài khoản"
      stepLabel="Bước 2/2"
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu mới</Text>
        <View
          style={[
            styles.inputContainer,
            value.length > 0 && !passwordOk ? styles.inputContainerInvalid : null,
          ]}
        >
          <Feather name="lock" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
            secureTextEntry={!showPassword}
            value={value}
            onChangeText={setValue}
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
        <PasswordRequirementList password={value} />
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
          <Text style={styles.primaryButtonText}>Đổi mật khẩu</Text>
        )}
      </TouchableOpacity>
    </ChangeSecurityShell>
  )
}
