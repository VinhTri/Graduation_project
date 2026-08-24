import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Href } from 'expo-router'
import { axiosClient } from '@/shared/api/axiosClient'
import { clearStoredSession } from '@/shared/services/sessionStorage'

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
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      await clearStoredSession()
    }
    return '/(auth)/login'
  }

  return '/(tabs)/home'
}
