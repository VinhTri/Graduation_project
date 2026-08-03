import { Stack } from 'expo-router';
import { CategoryProvider } from '../shared/contexts/CategoryContext';
import { ThemeLanguageProvider, useTheme } from '../shared/contexts/ThemeLanguageContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

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
      <ThemeLanguageProvider>
        <CategoryProvider>
          <RootStack />
        </CategoryProvider>
      </ThemeLanguageProvider>
    </GestureHandlerRootView>
  );
}
