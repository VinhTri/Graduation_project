import { useCallback, useState } from 'react'
import { Text, TouchableOpacity, View, Image } from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getCustomerProfile } from '@/shared/services'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'
import { styles } from '../SettingsScreen.styles'

function getInitials(name: string) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0] || 'Người dùng'
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ProfileHeader() {
  const router = useRouter()
  const [userName, setUserName] = useState('Người dùng')
  const [userEmail, setUserEmail] = useState('')
  const [accountNumber, setAccountNumber] = useState('Chưa thiết lập')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const fetchProfile = async (isCancelled: () => boolean = () => false) => {
    try {
      const profile = await getCustomerProfile()
      if (isCancelled()) return
      setUserEmail(profile.email || '')
      setUserName(profile.username || nameFromEmail(profile.email || 'Người dùng'))
      setAccountNumber(profile.accountNumber || 'Chưa thiết lập')
      setAvatarUrl(profile.avatarUrl ?? null)
    } catch {
      if (!isCancelled()) {
        setUserEmail('')
        setUserName('Người dùng')
        setAvatarUrl(null)
      }
    }
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      fetchProfile(() => cancelled)
      return () => {
        cancelled = true
      }
    }, []),
  )

  return (
    <PastelHeaderShell
        contentStyle={styles.headerContent}
        coverImage={require('../../../assets/images/account-list-header.png')}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.85}
            onPress={() => router.push('/settings/profile')}
          >
            {avatarUrl ? (
              <View style={{ width: '100%', height: '100%', borderRadius: 999, overflow: 'hidden' }}>
                <View style={{ width: '100%', height: '100%', backgroundColor: PASTEL_PALETTE.gray200 }}>
                  <Image
                    source={{ uri: resolveMediaUrl(avatarUrl) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
              <MaterialIcons name="verified" size={16} color={PASTEL_PALETTE.accentDeep} />
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail || 'Chưa cập nhật email'}
            </Text>
            <Text style={styles.userStk} numberOfLines={1}>
              STK: {accountNumber}
            </Text>
            <View style={styles.badge}>
              <Feather name="shield" size={11} color={PASTEL_PALETTE.accentDeep} />
              <Text style={styles.badgeText}>Đã xác thực</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/settings/profile')}
          >
            <Feather name="edit-2" size={16} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
        </View>
    </PastelHeaderShell>
  )
}
