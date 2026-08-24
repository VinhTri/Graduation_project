import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '@/shared/components/Toast';
import { MoneyFormatProvider } from '@/shared/contexts/MoneyFormatContext';
import { ThemeLanguageProvider, useTheme } from '../shared/contexts/ThemeLanguageContext';

function RootStack() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBarStyle === 'dark-content' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeLanguageProvider>
          <MoneyFormatProvider>
            <ToastProvider>
              <RootStack />
            </ToastProvider>
          </MoneyFormatProvider>
        </ThemeLanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
