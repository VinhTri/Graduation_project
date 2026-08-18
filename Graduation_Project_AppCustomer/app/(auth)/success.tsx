import { useCallback } from 'react';
import { useLocalSearchParams, type Href } from 'expo-router';
import AuthWelcomeLoadingScreen from '@/features/auth/components/AuthWelcomeLoadingScreen';
import { useRegisterDraft } from '@/features/auth/context/RegisterContext';
import { axiosClient } from '@/shared/api/axiosClient';

type AuthSuccessMode = 'login' | 'register';

async function resolveRouteAfterAuth(): Promise<Href> {
  try {
    const res: any = await axiosClient.get('/api/v1/auth/pin-status', { timeout: 2500 });
    const hasPin = res?.data === true;
    // Chưa có PIN → bắt buộc thiết lập lần đầu
    return hasPin ? '/(tabs)/home' : '/(auth)/setup-pin';
  } catch {
    // Lỗi gọi API → vẫn đưa vào setup-pin để không bỏ sót lần đầu
    return '/(auth)/setup-pin';
  }
}

export default function AuthSuccessScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { reset } = useRegisterDraft();

  const successMode: AuthSuccessMode = mode === 'register' ? 'register' : 'login';

  const resolveNextRoute = useCallback(async (): Promise<Href> => {
    return resolveRouteAfterAuth();
  }, []);

  return (
    <AuthWelcomeLoadingScreen
      headline={successMode === 'register' ? 'Đăng ký thành công' : 'Đăng nhập thành công'}
      message="Chào mừng bạn đến với hệ thống"
      onComplete={successMode === 'register' ? reset : undefined}
      resolveNextRoute={resolveNextRoute}
    />
  );
}
