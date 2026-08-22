import { Image, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { styles } from './WalletFlowPanel.styles'

const WALLET_FLOW_IMAGE = require('../../../../assets/images/wallet-real-money-flow.png')

export function WalletHomePanel() {
  return (
    <View style={styles.wrap}>
      <View style={styles.storyCard}>
        <Image source={WALLET_FLOW_IMAGE} style={styles.storyImage} resizeMode="cover" />

        <View style={styles.storyCopy}>
          <Text style={styles.eyebrow}>DÒNG TIỀN SMARTSPEND</Text>
          <Text style={styles.title}>Kết nối ví với ngân hàng</Text>
          <Text style={styles.description}>
            Nạp tiền qua QR, đối soát tự động và rút về tài khoản liên kết trong một luồng an toàn.
          </Text>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="qr-code-outline" size={15} color={PASTEL_PALETTE.accentDeep} />
              </View>
              <Text style={styles.featureText}>Nạp qua QR</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark-outline" size={16} color={PASTEL_PALETTE.accentDeep} />
              </View>
              <Text style={styles.featureText}>Rút an toàn</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
