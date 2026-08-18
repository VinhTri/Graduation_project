import { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getCustomerProfile } from '@/shared/services'
import { styles } from '../SettingsScreen.styles'
import { ProfileDetailModal } from './ProfileDetailModal'

function getInitials(name: string) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function formatCreatedAt(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN')
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
  const [userName, setUserName] = useState('Người dùng')
  const [userEmail, setUserEmail] = useState('')
  const [accountNumber, setAccountNumber] = useState('Chưa thiết lập')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileVisible, setProfileVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const profile = await getCustomerProfile()
        if (cancelled) return
        setUserEmail(profile.email || '')
        setUserName(nameFromEmail(profile.email || 'Người dùng'))
        setAccountNumber(profile.accountNumber || 'Chưa thiết lập')
        setCreatedAt(profile.createdAt ?? null)
      } catch {
        if (!cancelled) {
          setUserEmail('')
          setUserName('Người dùng')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
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
            onPress={() => setProfileVisible(true)}
          >
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
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
            onPress={() => setProfileVisible(true)}
          >
            <Feather name="edit-2" size={16} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      <ProfileDetailModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        loading={loading && !userEmail}
        userName={userName}
        userEmail={userEmail}
        accountNumber={accountNumber}
        createdAtLabel={formatCreatedAt(createdAt)}
      />
    </>
  )
}
