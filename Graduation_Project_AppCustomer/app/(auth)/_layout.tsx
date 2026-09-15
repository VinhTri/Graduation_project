import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { RegisterProvider } from '@/features/auth/context/RegisterContext';
import { preloadLoginSlideImages } from '@/features/auth/utils/preloadLoginSlideImages';

export default function AuthLayout() {
  useEffect(() => {
    preloadLoginSlideImages().catch(() => undefined);
  }, []);

  return (
    <RegisterProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </RegisterProvider>
  );
}
