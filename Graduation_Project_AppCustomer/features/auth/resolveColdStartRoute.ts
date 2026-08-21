import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Href } from 'expo-router'
import { axiosClient } from '@/shared/api/axiosClient'

/** Tài khoản đã login nhưng chưa setup PIN → tiếp tục từ màn giới thiệu. */
export async function resolveColdStartRoute(): Promise<Href> {
  const token = await AsyncStorage.getItem('token')
  if (!token) {
    return '/(auth)/login'
  }

  try {
    const res: any = await axiosClient.get('/api/v1/auth/pin-status', { timeout: 2500 })
    const hasPin = res?.data === true
    if (!hasPin) {
      return '/(auth)/onboarding'
    }
  } catch {
    // Không chắc PIN → ưu tiên hoàn tất onboarding + setup PIN
    return '/(auth)/onboarding'
  }

  return '/(auth)/login'
}
