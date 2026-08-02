import { Stack } from 'expo-router';
import { CategoryProvider } from '../shared/contexts/CategoryContext';
import { ThemeLanguageProvider } from '../shared/contexts/ThemeLanguageContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeLanguageProvider>
        <CategoryProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CategoryProvider>
      </ThemeLanguageProvider>
    </GestureHandlerRootView>
  );
}

