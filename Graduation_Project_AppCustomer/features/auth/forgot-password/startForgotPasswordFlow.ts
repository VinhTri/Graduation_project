import { Alert } from 'react-native'
import type { Router } from 'expo-router'
import { beginForgotPasswordDraft } from '@/features/auth/forgot-password/forgotPasswordDraft'
import { authService } from '@/shared/api/services/auth.service'
import { getCustomerProfile } from '@/shared/services'

/** Gửi OTP quên mật khẩu (user đã đăng nhập) rồi mở màn OTP full-page. */
export async function startForgotPasswordFlow(router: Router) {
  const profile = await getCustomerProfile()
  const email = profile.email?.trim() || ''
  if (!email) {
    throw new Error('Không tìm thấy email tài khoản để gửi OTP.')
  }

  await authService.forgotPassword({ email })
  beginForgotPasswordDraft(email)
  router.push('/settings/forgot-password/otp')
}

export async function startForgotPasswordFlowSafe(router: Router) {
  try {
    await startForgotPasswordFlow(router)
    return true
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Không thể gửi mã OTP khôi phục mật khẩu.'
    Alert.alert('Lỗi', message)
    return false
  }
}
