import { Stack } from 'expo-router'
import { ChangeSecurityProvider } from '@/features/settings/context/ChangeSecurityContext'

export default function SettingsLayout() {
  return (
    <ChangeSecurityProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ChangeSecurityProvider>
  )
}
