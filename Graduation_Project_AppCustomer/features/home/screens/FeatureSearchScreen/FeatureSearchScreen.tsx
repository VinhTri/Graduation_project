import { useMemo, useRef, useState } from 'react'
import { Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeReceiveQr } from '../../components/HomeReceiveQr'
import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext'
import { styles } from './FeatureSearchScreen.styles'

type SearchFeature = {
  id: string
  labelVi: string
  labelEn: string
  hintVi: string
  hintEn: string
  keywords: string
  icon: keyof typeof Ionicons.glyphMap
  route?: string
  action?: 'receive-qr' | 'scan-qr'
}

const FEATURES: SearchFeature[] = [
  { id: 'top-up', labelVi: 'Nạp tiền', labelEn: 'Top up', hintVi: 'Nạp tiền vào ví', hintEn: 'Add money to wallet', keywords: 'nap tien top up them tien', icon: 'add-circle-outline', route: '/wallet/top-up' },
  { id: 'withdraw', labelVi: 'Rút tiền', labelEn: 'Withdraw', hintVi: 'Rút về tài khoản ngân hàng', hintEn: 'Withdraw to a bank', keywords: 'rut tien withdraw ngan hang', icon: 'arrow-down-circle-outline', route: '/wallet/withdraw' },
  { id: 'transfer', labelVi: 'Chuyển tiền', labelEn: 'Transfer', hintVi: 'Chuyển tiền nội bộ', hintEn: 'Transfer inside SmartSpend', keywords: 'chuyen tien transfer noi bo', icon: 'paper-plane-outline', route: '/transfer' },
  { id: 'receive-qr', labelVi: 'QR nhận tiền', labelEn: 'Receive QR', hintVi: 'Hiển thị mã QR nhận tiền', hintEn: 'Show your receive QR', keywords: 'qr nhan tien receive ma', icon: 'qr-code-outline', action: 'receive-qr' },
  { id: 'scan-qr', labelVi: 'Quét mã QR', labelEn: 'Scan QR', hintVi: 'Chuyển tiền bằng mã QR', hintEn: 'Transfer by scanning QR', keywords: 'quet scan ma qr', icon: 'scan-outline', action: 'scan-qr' },
  { id: 'wallet', labelVi: 'Ví SmartSpend', labelEn: 'Wallet', hintVi: 'Số dư và tiện ích ví', hintEn: 'Balance and wallet tools', keywords: 'vi wallet so du', icon: 'wallet-outline', route: '/(tabs)/wallet' },
  { id: 'history', labelVi: 'Lịch sử giao dịch', labelEn: 'Transaction history', hintVi: 'Xem các giao dịch trong ví', hintEn: 'Review wallet activity', keywords: 'lich su giao dich history', icon: 'time-outline', route: '/wallet/history' },
  { id: 'notebook', labelVi: 'Sổ tay thu chi', labelEn: 'Finance notebook', hintVi: 'Ghi chép thu nhập, chi tiêu', hintEn: 'Record income and expenses', keywords: 'so tay thu chi notebook', icon: 'book-outline', route: '/(tabs)/notebook' },
  { id: 'budget', labelVi: 'Ngân sách', labelEn: 'Budgets', hintVi: 'Tạo và theo dõi ngân sách', hintEn: 'Create and track budgets', keywords: 'ngan sach budget chi tieu', icon: 'pie-chart-outline', route: '/budget' },
  { id: 'funds', labelVi: 'Quỹ', labelEn: 'Funds', hintVi: 'Quản lý quỹ cá nhân, quỹ nhóm', hintEn: 'Manage personal and group funds', keywords: 'quy fund tiet kiem nhom', icon: 'file-tray-full-outline', route: '/(tabs)/funds' },
  { id: 'invoice', labelVi: 'Hóa đơn', labelEn: 'Invoices', hintVi: 'Quản lý hóa đơn định kỳ', hintEn: 'Manage recurring bills', keywords: 'hoa don invoice dien nuoc internet', icon: 'receipt-outline', route: '/invoice' },
  { id: 'split-bill', labelVi: 'Chia tiền', labelEn: 'Split bill', hintVi: 'Chia chi phí cùng bạn bè', hintEn: 'Split expenses with friends', keywords: 'chia tien split bill ban be', icon: 'people-outline', route: '/split-bill' },
  { id: 'contacts', labelVi: 'Danh bạ', labelEn: 'Contacts', hintVi: 'Bạn bè và người liên hệ', hintEn: 'Friends and contacts', keywords: 'danh ba contact ban be', icon: 'people-circle-outline', route: '/contacts' },
  { id: 'categories', labelVi: 'Danh mục', labelEn: 'Categories', hintVi: 'Quản lý danh mục giao dịch', hintEn: 'Manage transaction categories', keywords: 'danh muc category phan loai', icon: 'layers-outline', route: '/categories' },
  { id: 'finance-center', labelVi: 'Trung tâm tài chính', labelEn: 'Finance center', hintVi: 'Báo cáo và phân tích tài chính', hintEn: 'Reports and financial insights', keywords: 'trung tam tai chinh bao cao finance report', icon: 'analytics-outline', route: '/finance-center' },
  { id: 'notifications', labelVi: 'Thông báo', labelEn: 'Notifications', hintVi: 'Xem thông báo của bạn', hintEn: 'View your notifications', keywords: 'thong bao notification', icon: 'notifications-outline', route: '/notifications' },
]

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi-VN').trim()
}

export default function FeatureSearchScreen({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const [query, setQuery] = useState('')
  const [receiveVisible, setReceiveVisible] = useState(false)
  const { language } = useLanguage()
  const { theme } = useTheme()
  const isEn = language === 'en'

  const results = useMemo(() => {
    const normalizedQuery = normalize(query)
    if (!normalizedQuery) return FEATURES
    return FEATURES.filter((feature) => normalize([
      feature.labelVi,
      feature.labelEn,
      feature.hintVi,
      feature.hintEn,
      feature.keywords,
    ].join(' ')).includes(normalizedQuery))
  }, [query])

  function closeSearch() {
    Keyboard.dismiss()
    onClose()
  }

  function openFeature(feature: SearchFeature) {
    Keyboard.dismiss()
    if (feature.action === 'receive-qr') {
      setReceiveVisible(true)
      return
    }
    if (feature.action === 'scan-qr') {
      onClose()
      router.push({ pathname: '/transfer', params: { scan: '1' } })
      return
    }
    if (feature.route) {
      onClose()
      router.push(feature.route as never)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}> 
          <Ionicons name="search-outline" size={21} color={theme.primary} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.textPrimary }]}
            value={query}
            onChangeText={setQuery}
            placeholder={isEn ? 'Which feature do you need?' : 'Bạn muốn tìm chức năng gì?'}
            placeholderTextColor={theme.textMuted}
            autoFocus
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setQuery(''); inputRef.current?.focus() }} accessibilityLabel={isEn ? 'Clear search' : 'Xóa nội dung'}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.card }]} onPress={closeSearch} accessibilityRole="button" accessibilityLabel={isEn ? 'Close search' : 'Đóng tìm kiếm'}>
          <Ionicons name="close" size={25} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>{query ? (isEn ? 'Search results' : 'Kết quả tìm kiếm') : (isEn ? 'All features' : 'Tất cả chức năng')}</Text>
        <Text style={[styles.count, { color: theme.textMuted }]}>{results.length}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 24 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {results.length ? results.map((feature) => (
          <TouchableOpacity key={feature.id} style={[styles.featureRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => openFeature(feature)} activeOpacity={0.75}>
            <View style={[styles.featureIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name={feature.icon} size={21} color={theme.primary} />
            </View>
            <View style={styles.featureCopy}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{isEn ? feature.labelEn : feature.labelVi}</Text>
              <Text style={[styles.featureHint, { color: theme.textSecondary }]} numberOfLines={1}>{isEn ? feature.hintEn : feature.hintVi}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}><Ionicons name="search-outline" size={30} color={theme.primary} /></View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{isEn ? 'No feature found' : 'Không tìm thấy chức năng'}</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{isEn ? 'Try a shorter or different keyword.' : 'Hãy thử một từ khóa ngắn hơn hoặc từ khóa khác.'}</Text>
          </View>
        )}
      </ScrollView>

      <HomeReceiveQr visible={receiveVisible} onClose={() => setReceiveVisible(false)} />
    </View>
  )
}
