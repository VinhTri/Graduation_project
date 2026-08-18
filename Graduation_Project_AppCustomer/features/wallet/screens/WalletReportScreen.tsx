import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { WalletReport } from '@/features/wallet/report'
import { styles } from './WalletReportScreen.styles'

export default function WalletReportScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Báo cáo ví</Text>
            <Text style={styles.subtitle}>Theo dõi nạp / rút SmartSpend</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <View style={styles.body}>
        <WalletReport active />
      </View>
    </View>
  )
}
