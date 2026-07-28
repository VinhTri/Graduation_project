import { Stack } from 'expo-router';
import { CategoryProvider } from '../shared/contexts/CategoryContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CategoryProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CategoryProvider>
    </GestureHandlerRootView>
  );
}
