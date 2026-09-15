import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather, Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { userService } from '@/shared/api/services/userService'
import { getCustomerProfile, type CustomerProfile } from '@/shared/services'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'
import { styles } from './ProfileScreen.styles'

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'U'
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : words[0].slice(0, 2).toUpperCase()
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN')
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function loadProfile() {
    try {
      setError('')
      const data = await getCustomerProfile()
      setProfile(data)
      setName(data.username || '')
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thông tin tài khoản')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function pickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result.canceled || !result.assets[0]?.uri) return

      setUploading(true)
      setError('')
      const updated = await userService.uploadAvatar(result.assets[0].uri)
      setProfile((current) => current ? { ...current, avatarUrl: updated.avatarUrl } : current)
      showToast({ variant: 'success', message: 'Đã cập nhật ảnh đại diện' })
    } catch (e: any) {
      setError(e?.message || 'Không thể cập nhật ảnh đại diện')
    } finally {
      setUploading(false)
    }
  }

  async function saveName() {
    const nextName = name.trim()
    if (!nextName) {
      setError('Tên hiển thị không được để trống')
      return
    }
    if (nextName === profile?.username) {
      router.back()
      return
    }

    try {
      setSaving(true)
      setError('')
      const updated = await userService.updateUsername(nextName)
      if (updated.token) await AsyncStorage.setItem('token', updated.token)
      setProfile((current) => current ? { ...current, username: updated.username } : current)
      showToast({ variant: 'success', message: 'Đã cập nhật tên hiển thị' })
      router.back()
    } catch (e: any) {
      setError(e?.message || 'Không thể cập nhật tên hiển thị')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={23} color={PASTEL_PALETTE.title} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>Tài khoản</Text>
            <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          </View>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 116 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatar} onPress={pickAvatar} disabled={uploading} activeOpacity={0.82}>
              {uploading ? (
                <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
              ) : profile?.avatarUrl ? (
                <Image source={{ uri: resolveMediaUrl(profile.avatarUrl) }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials(name)}</Text>
              )}
              <View style={styles.cameraBadge}>
                <Feather name="camera" size={16} color={PASTEL_PALETTE.white} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickAvatar} disabled={uploading} activeOpacity={0.7}>
              <Text style={styles.changePhotoText}>{uploading ? 'Đang tải ảnh...' : 'Thay ảnh đại diện'}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={17} color={PASTEL_PALETTE.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Tên hiển thị</Text>
          <View style={styles.nameField}>
            <Feather name="user" size={18} color={PASTEL_PALETTE.lavender} />
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={(value) => {
                setName(value)
                if (error) setError('')
              }}
              placeholder="Nhập tên hiển thị"
              placeholderTextColor={PASTEL_PALETTE.gray400}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <Text style={styles.counter}>{name.length}/50</Text>
          </View>

          <Text style={styles.sectionLabel}>Thông tin tài khoản</Text>
          <View style={styles.infoList}>
            <InfoRow icon="mail" label="Email" value={profile?.email || '—'} />
            <InfoRow icon="credit-card" label="Số tài khoản" value={profile?.accountNumber || 'Chưa thiết lập'} />
            <InfoRow icon="calendar" label="Ngày tham gia" value={formatDate(profile?.createdAt)} last />
          </View>
          <Text style={styles.readOnlyHint}>Email và số tài khoản được bảo vệ, không thể chỉnh sửa tại đây.</Text>
        </ScrollView>
      )}

      {!loading ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={[styles.saveButton, (saving || uploading) && styles.saveButtonDisabled]}
            onPress={saveName}
            disabled={saving || uploading}
            activeOpacity={0.86}
          >
            {saving ? (
              <ActivityIndicator color={PASTEL_PALETTE.white} />
            ) : (
              <>
                <Feather name="check" size={18} color={PASTEL_PALETTE.white} />
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}

function InfoRow({ icon, label, value, last }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIcon}><Feather name={icon} size={16} color={PASTEL_PALETTE.accentDeep} /></View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
      <Feather name="lock" size={14} color={PASTEL_PALETTE.gray400} />
    </View>
  )
}
