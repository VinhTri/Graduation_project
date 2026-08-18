import { Text, TouchableOpacity, View } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { styles } from '../SettingsScreen.styles'

export function QuickActionCard() {
  const router = useRouter()

  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={styles.quickActionCard}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/wallet')}
      >
        <View style={styles.quickActionHeader}>
          <Text style={styles.quickActionTitle}>Ví của tôi</Text>
          <View style={[styles.iconBox, styles.iconBoxPink]}>
            <Ionicons name="wallet-outline" size={18} color={PASTEL_PALETTE.accentDeep} />
          </View>
        </View>
        <Text style={styles.quickActionSubtitle}>Xem số dư và giao dịch</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionCard}
        activeOpacity={0.85}
        onPress={() => router.push('/settings/bank-binding')}
      >
        <View style={styles.quickActionHeader}>
          <Text style={styles.quickActionTitle}>Ngân hàng</Text>
          <View style={[styles.iconBox, styles.iconBoxLavender]}>
            <Feather name="credit-card" size={17} color={PASTEL_PALETTE.lavender} />
          </View>
        </View>
        <Text style={styles.quickActionSubtitle}>Liên kết tài khoản NH</Text>
      </TouchableOpacity>
    </View>
  )
}
