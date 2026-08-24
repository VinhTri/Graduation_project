import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, Share, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { userService } from '@/shared/api/services/userService'
import { getDefaultWallet } from '@/shared/services'
import { createSmartSpendTransferQr } from '@/shared/utils/smartSpendQr'
import { styles } from './HomeReceiveQr.styles'

type Props = {
  visible: boolean
  onClose: () => void
}

export function HomeReceiveQr({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<'internal' | 'sepay'>('internal')
  const [accountNumber, setAccountNumber] = useState('')
  const [displayName, setDisplayName] = useState('SmartSpend')
  const [loading, setLoading] = useState(true)

  const loadWallet = useCallback(async () => {
    setLoading(true)
    try {
      const [walletResult, profileResult] = await Promise.allSettled([
        getDefaultWallet(),
        userService.getMyProfile(),
      ])
      if (walletResult.status === 'fulfilled') {
        setAccountNumber(String(walletResult.value?.accountNumber || '').trim())
      }
      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value
        setDisplayName(profile.username || profile.email?.split('@')[0] || 'SmartSpend')
      }
    } catch {
      setAccountNumber('')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { loadWallet() }, [loadWallet]))

  // Giá trị minh họa sẽ được thay bằng VietQR do SePay/backend trả về khi tích hợp thật.
  const demoQrValue = useMemo(
    () => `SMARTSPEND_SEPAY_DEMO|NAP ${accountNumber || '0000000000'}`,
    [accountNumber],
  )
  const internalQrValue = useMemo(
    () => accountNumber ? createSmartSpendTransferQr(accountNumber) : '',
    [accountNumber],
  )

  const shareAccount = async () => {
    if (!accountNumber) return
    await Share.share({
      title: 'Nhận tiền qua SmartSpend',
      message: `${displayName} nhận tiền qua SmartSpend\nSố tài khoản: ${accountNumber}`,
    })
  }

  const close = () => {
    setActiveTab('internal')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerSpacer} />
            <View style={styles.modalHeading}>
              <Text style={styles.modalEyebrow}>QR NHẬN TIỀN</Text>
              <Text style={styles.modalTitle}>Mã nhận tiền</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Ionicons name="close" size={22} color="#3A303E" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'internal' && styles.tabItemActive]}
              onPress={() => setActiveTab('internal')}
              activeOpacity={0.78}
            >
              <Ionicons name="wallet-outline" size={17} color={activeTab === 'internal' ? '#6D4AAF' : '#8D818F'} />
              <Text style={[styles.tabText, activeTab === 'internal' && styles.tabTextActive]}>SmartSpend</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'sepay' && styles.tabItemActive]}
              onPress={() => setActiveTab('sepay')}
              activeOpacity={0.78}
            >
              <Ionicons name="business-outline" size={17} color={activeTab === 'sepay' ? '#6D4AAF' : '#8D818F'} />
              <Text style={[styles.tabText, activeTab === 'sepay' && styles.tabTextActive]}>Ngân hàng</Text>
              <View style={styles.tabDemoBadge}><Text style={styles.tabDemoText}>DEMO</Text></View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
              <Text style={styles.choiceText}>Đang lấy thông tin ví...</Text>
            </View>
          ) : activeTab === 'internal' ? (
            internalQrValue ? (
              <View style={styles.transferContent}>
                <View style={styles.qrFrame}>
                  <View style={styles.qrInner}>
                    <QRCode value={internalQrValue} size={220} color="#37253F" backgroundColor="#FFFFFF" ecl="M" />
                  </View>
                  <View style={styles.qrMark}><Ionicons name="wallet" size={18} color="#FFF" /></View>
                </View>
                <Text style={styles.ownerName} numberOfLines={1}>{displayName}</Text>
                <Text style={styles.accountLabel}>Số tài khoản SmartSpend</Text>
                <Text style={styles.accountNumber}>{accountNumber}</Text>
                <Text style={styles.hint}>Bạn bè quét mã để chuyển tiền nội bộ vào ví của bạn.</Text>
                <TouchableOpacity style={styles.shareButton} onPress={shareAccount} activeOpacity={0.78}>
                  <Ionicons name="share-social-outline" size={18} color="#FFF" />
                  <Text style={styles.shareButtonText}>Chia sẻ mã nhận tiền</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.unavailableState}>
                <Ionicons name="qr-code-outline" size={42} color="#A78BBA" />
                <Text style={styles.unavailableTitle}>Chưa có số tài khoản ví</Text>
                <Text style={styles.unavailableText}>Mở trang Ví để hoàn tất thiết lập tài khoản SmartSpend.</Text>
              </View>
            )
          ) : (
            <View style={styles.transferContent}>
              <View style={styles.demoBanner}>
                <Ionicons name="flask-outline" size={17} color="#A32768" />
                <Text style={styles.demoBannerText}>MÃ DEMO · CHƯA KẾT NỐI SEPAY</Text>
              </View>
              <View style={styles.bankQrFrame}>
                <View style={styles.qrInner}>
                  <QRCode value={demoQrValue} size={220} color="#37253F" backgroundColor="#FFFFFF" ecl="M" />
                </View>
                <View style={styles.bankQrMark}>
                  <Ionicons name="business" size={18} color="#FFF" />
                </View>
              </View>
              <Text style={styles.ownerName}>Nạp tiền vào ví SmartSpend</Text>
              <Text style={styles.accountLabel}>Nội dung chuyển khoản minh họa</Text>
              <Text style={styles.accountNumber}>NAP {accountNumber || '0000000000'}</Text>
              <Text style={styles.hint}>
                Khi tích hợp SePay, số tiền chuyển thành công sẽ được đối soát và cộng vào ví.
              </Text>
              <View style={styles.demoNotice}>
                <Ionicons name="warning-outline" size={19} color="#B33B6E" />
                <Text style={styles.demoNoticeText}>
                  Không dùng mã này để chuyển tiền thật. QR chính thức sẽ được thay khi kết nối SePay.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

export default HomeReceiveQr
