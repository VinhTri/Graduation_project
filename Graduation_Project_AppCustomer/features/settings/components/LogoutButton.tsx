import { Text, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { logoutCustomer } from '@/shared/services'
import { styles } from '../SettingsScreen.styles'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutCustomer()
    } finally {
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={styles.logoutContainer}>
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.75} onPress={handleLogout}>
        <Feather name="log-out" size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
      <Text style={styles.versionText}>SmartSpend · v1.0.0</Text>
    </View>
  )
}
