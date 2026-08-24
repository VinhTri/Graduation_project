import { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { AppSettingsSection } from './components/AppSettingsSection'
import { LogoutButton } from './components/LogoutButton'
import { NotebookSettingsSection } from './components/NotebookSettingsSection'
import { ProfileHeader } from './components/ProfileHeader'
import { SecuritySection } from './components/SecuritySection'
import { SettingsItem } from './components/SettingsItem'
import { SettingsSection } from './components/SettingsSection'
import { WalletSmartSpendSection } from './components/WalletSmartSpendSection'
import { styles } from './SettingsScreen.styles'

const ICON = PASTEL_PALETTE.accentDeep

const SECURITY_TOAST_MESSAGE: Record<string, string> = {
  password: 'Mật khẩu đã đổi thành công!',
  pin: 'Mã PIN đã thay đổi thành công!',
}

export function SettingsScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ securityToast?: string | string[] }>()
  const bottomPad = Math.max(insets.bottom, 10) + 90

  useEffect(() => {
    const raw = params.securityToast
    const key = Array.isArray(raw) ? raw[0] : raw
    if (!key) return

    const message = SECURITY_TOAST_MESSAGE[key]
    if (!message) return

    showToast({ variant: 'success', message })
    router.setParams({ securityToast: undefined })
  }, [params.securityToast, router, showToast])

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        <SettingsSection title="Tài chính">
          <SettingsItem
            icon={<Ionicons name="card-outline" size={20} color={ICON} />}
            title="Liên kết ngân hàng"
            subtitle="Quản lý tài khoản ngân hàng"
            onPress={() => router.push('/settings/bank-binding')}
          />
          <WalletSmartSpendSection />
          <NotebookSettingsSection />
        </SettingsSection>

        <SecuritySection />

        <SettingsSection title="Hỗ trợ & Cài đặt">
          <SettingsItem
            icon={<Feather name="headphones" size={19} color={ICON} />}
            title="Trung tâm hỗ trợ"
            subtitle="Câu hỏi thường gặp"
            onPress={() => router.push('/settings/support')}
          />
          <AppSettingsSection />
        </SettingsSection>

        <LogoutButton />
      </ScrollView>
    </View>
  )
}
