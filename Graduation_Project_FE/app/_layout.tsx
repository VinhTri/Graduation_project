import { Stack } from 'expo-router';
import { CategoryProvider } from '../shared/contexts/CategoryContext';

export default function RootLayout() {
  return (
    <CategoryProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CategoryProvider>
  );
}
