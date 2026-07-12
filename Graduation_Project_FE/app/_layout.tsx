import { Stack } from 'expo-router';
import { CategoryProvider } from '../shared/contexts/CategoryContext';
import { BudgetProvider } from '../shared/contexts/BudgetContext';

export default function RootLayout() {
  return (
    <CategoryProvider>
      <BudgetProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </BudgetProvider>
    </CategoryProvider>
  );
}
