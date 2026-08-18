import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { styles } from '../SettingsScreen.styles'

type Props = {
  visible: boolean
  onClose: () => void
  loading?: boolean
  userName: string
  userEmail: string
  accountNumber?: string
  createdAtLabel?: string
  verified?: boolean
}

function getInitials(name: string) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function ProfileDetailModal({
  visible,
  onClose,
  loading = false,
  userName,
  userEmail,
  accountNumber = 'Chưa thiết lập',
  createdAtLabel = '—',
  verified = true,
}: Props) {
  const insets = useSafeAreaInsets()
  const displayName = userName || 'Người dùng'
  const displayEmail = userEmail || '—'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.profileModalOverlay}>
        <TouchableOpacity style={styles.profileModalBackdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[styles.profileModalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        >
          <View style={styles.profileModalHandle} />

          <View style={styles.profileModalHeader}>
            <Text style={styles.profileModalTitle}>Thông tin tài khoản</Text>
            <TouchableOpacity style={styles.profileModalClose} onPress={onClose} activeOpacity={0.75}>
              <Feather name="x" size={18} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.profileModalLoading}>
              <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.profileModalHero}>
                <View style={styles.profileModalAvatar}>
                  <Text style={styles.profileModalAvatarText}>{getInitials(displayName)}</Text>
                </View>
                <Text style={styles.profileModalChangeHint}>
                  Đổi ảnh đại diện sẽ sớm có
                </Text>

                <View style={styles.profileModalNameRow}>
                  <Text style={styles.profileModalName}>{displayName}</Text>
                  <MaterialIcons name="verified" size={18} color={PASTEL_PALETTE.accentDeep} />
                </View>
                <View style={[styles.badge, { alignSelf: 'center', marginTop: 10 }]}>
                  <Feather name="shield" size={11} color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.badgeText}>
                    {verified ? 'Đã xác thực' : 'Chưa kích hoạt'}
                  </Text>
                </View>
              </View>

              <View style={styles.profileModalCard}>
                <InfoRow icon="user" label="Tên hiển thị" value={displayName} />
                <InfoRow icon="mail" label="Email" value={displayEmail} />
                <InfoRow icon="credit-card" label="Số tài khoản" value={accountNumber} />
                <InfoRow icon="calendar" label="Ngày tạo tài khoản" value={createdAtLabel} isLast />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: React.ComponentProps<typeof Feather>['name']
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <View style={[styles.profileInfoRow, isLast && styles.profileInfoRowLast]}>
      <View style={styles.profileInfoIcon}>
        <Feather name={icon} size={16} color={PASTEL_PALETTE.accentDeep} />
      </View>
      <View style={styles.profileInfoContent}>
        <Text style={styles.profileInfoLabel}>{label}</Text>
        <Text style={styles.profileInfoValue}>{value}</Text>
      </View>
    </View>
  )
}
