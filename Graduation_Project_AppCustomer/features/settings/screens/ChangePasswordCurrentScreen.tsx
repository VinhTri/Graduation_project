import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import ChangeSecurityShell from '@/features/settings/components/ChangeSecurityShell'
import { useChangeSecurityDraft } from '@/features/settings/context/ChangeSecurityContext'
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors'
import { verifyCurrentPassword } from '@/shared/services'
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles'

export default function ChangePasswordCurrentScreen() {
  const router = useRouter()
  const { setCurrentPassword, clearPasswordDraft } = useChangeSecurityDraft()
  const [value, setValue] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      return
    }

    setLoading(true)
    setError('')
    try {
      await verifyCurrentPassword({ currentPassword: trimmed })
      setCurrentPassword(trimmed)
      router.push('/settings/change-password/new')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Mật khẩu hiện tại không đúng!'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChangeSecurityShell
      title="Đổi mật khẩu"
      subtitle="Xác minh mật khẩu đăng nhập hiện tại"
      stepLabel="Bước 1/2"
      onBack={() => {
        clearPasswordDraft()
        if (router.canGoBack()) {
          router.back()
        } else {
          router.replace('/(tabs)/more')
        }
      }}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu hiện tại</Text>
        <View style={[styles.inputContainer, error ? { borderColor: '#EF4444' } : null]}>
          <Feather name="lock" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu hiện tại"
            placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
            secureTextEntry={!showPassword}
            value={value}
            onChangeText={(text) => {
              setValue(text)
              if (error) setError('')
            }}
            autoFocus
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={loading}
          >
            <Feather
              name={showPassword ? 'eye' : 'eye-off'}
              size={18}
              color={AUTH_INPUT_ICON}
            />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (loading || !value.trim()) && styles.primaryButtonDisabled,
        ]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={loading || !value.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Tiếp tục</Text>
        )}
      </TouchableOpacity>
    </ChangeSecurityShell>
  )
}
