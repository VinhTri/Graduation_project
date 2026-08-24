import { useCallback } from 'react'
import { useLocalSearchParams, type Href } from 'expo-router'
import AuthWelcomeLoadingScreen from '@/features/auth/components/AuthWelcomeLoadingScreen'
import { useRegisterDraft } from '@/features/auth/context/RegisterContext'
import { axiosClient } from '@/shared/api/axiosClient'
import { clearStoredSession } from '@/shared/services/sessionStorage'

type AuthSuccessMode = 'login' | 'register'

async function resolveRouteAfterLogin(): Promise<Href> {
  try {
    const res: any = await axiosClient.get('/api/v1/auth/pin-status', { timeout: 2500 })
    const hasPin = res?.data === true
    // Chưa có PIN → giới thiệu rồi mới thiết lập PIN
    return hasPin ? '/(tabs)/home' : '/(auth)/onboarding'
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      await clearStoredSession()
      return '/(auth)/login'
    }
    return '/(auth)/onboarding'
  }
}

export default function AuthSuccessScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  const { reset } = useRegisterDraft()

  const successMode: AuthSuccessMode = mode === 'register' ? 'register' : 'login'

  const resolveNextRoute = useCallback(async (): Promise<Href> => {
    // Đăng ký thành công → màn giới thiệu, rồi mới thiết lập PIN
    if (successMode === 'register') {
      return '/(auth)/onboarding'
    }
    return resolveRouteAfterLogin()
  }, [successMode])

  return (
    <AuthWelcomeLoadingScreen
      headline={successMode === 'register' ? 'Đăng ký thành công' : 'Đăng nhập thành công'}
      message="Chào mừng bạn đến với hệ thống"
      onComplete={successMode === 'register' ? reset : undefined}
      resolveNextRoute={resolveNextRoute}
    />
  )
}
