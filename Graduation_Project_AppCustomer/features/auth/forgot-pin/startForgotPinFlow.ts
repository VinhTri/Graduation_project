import { Alert } from 'react-native'
import type { Router } from 'expo-router'
import { beginForgotPinDraft } from '@/features/auth/forgot-pin/forgotPinDraft'
import { authService } from '@/shared/api/services/auth.service'
import { getCustomerProfile } from '@/shared/services'

/** Gửi OTP quên PIN rồi mở màn hình nhập OTP full-page. */
export async function startForgotPinFlow(router: Router) {
  const profile = await getCustomerProfile()
  const email = profile.email?.trim() || ''
  if (!email) {
    throw new Error('Không tìm thấy email tài khoản để gửi OTP.')
  }

  await authService.forgotPin()
  beginForgotPinDraft(email)
  router.push('/forgot-pin/otp')
}

export async function startForgotPinFlowSafe(router: Router) {
  try {
    await startForgotPinFlow(router)
    return true
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Không thể gửi mã OTP khôi phục mã PIN.'
    Alert.alert('Lỗi', message)
    return false
  }
}
