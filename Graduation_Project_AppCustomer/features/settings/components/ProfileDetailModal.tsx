import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import React, { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useBottomSheetPresence } from '@/shared/components/PinModal/useBottomSheetPresence'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { styles } from '../SettingsScreen.styles'
import * as ImagePicker from 'expo-image-picker'
import { userService } from '@/shared/api/services/userService'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Props = {
  visible: boolean
  onClose: () => void
  loading?: boolean
  userName: string
  userEmail: string
  accountNumber?: string
  createdAtLabel?: string
  verified?: boolean
  avatarUrl?: string | null
  onProfileUpdate?: () => void
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
  avatarUrl,
  onProfileUpdate,
}: Props) {
  const insets = useSafeAreaInsets()
  const displayName = userName || 'Người dùng'
  const displayEmail = userEmail || '—'
  const { presented, backdropOpacity, sheetTranslateY } = useBottomSheetPresence(visible)

  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [editingName, setEditingName] = useState(displayName)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [isSavingUsername, setIsSavingUsername] = useState(false)

  const handleClose = () => {
    Keyboard.dismiss()
    setIsEditingUsername(false)
    onClose()
  }

  // Reset local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setIsEditingUsername(false)
      setEditingName(displayName)
    }
  }, [visible, displayName])

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri
        setIsSavingAvatar(true)
        await userService.uploadAvatar(uri)
        onProfileUpdate?.()
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật ảnh đại diện')
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleSaveUsername = async () => {
    const newName = editingName.trim()
    if (!newName) {
      Alert.alert('Lỗi', 'Tên hiển thị không được để trống')
      return
    }
    if (newName === displayName) {
      setIsEditingUsername(false)
      return
    }

    try {
      setIsSavingUsername(true)
      const updatedProfile = await userService.updateUsername(newName)
      if (updatedProfile.token) {
        await AsyncStorage.setItem('token', updatedProfile.token)
      }
      onProfileUpdate?.()
      setIsEditingUsername(false)
      Keyboard.dismiss()
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật tên hiển thị (Có thể tên đã tồn tại)')
    } finally {
      setIsSavingUsername(false)
    }
  }

  return (
    <Modal
      visible={presented}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.profileModalKeyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.profileModalOverlay}>
          <Animated.View style={[styles.profileModalBackdrop, { opacity: backdropOpacity }]}>
            <Pressable style={{ flex: 1 }} onPress={handleClose} />
          </Animated.View>

        <Animated.View
          style={[
            styles.profileModalSheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.profileModalHandle} />

          <View style={styles.profileModalHeader}>
            <Text style={styles.profileModalTitle}>Thông tin tài khoản</Text>
            <TouchableOpacity style={styles.profileModalClose} onPress={handleClose} activeOpacity={0.75}>
              <Feather name="x" size={18} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.profileModalLoading}>
              <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              contentContainerStyle={styles.profileModalScrollContent}
            >
              <View style={styles.profileModalHero}>
                <View style={styles.profileSummaryRow}>
                  <View style={styles.profileModalAvatar}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl(avatarUrl) }}
                        style={styles.profileAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.profileModalAvatarText}>{getInitials(displayName)}</Text>
                    )}
                  </View>
                  <View style={styles.profileSummaryContent}>
                    <Text style={styles.profileModalName} numberOfLines={2}>{displayName}</Text>
                    <Text style={styles.profileSummaryEmail} numberOfLines={1}>{displayEmail}</Text>
                    <View style={styles.profileVerifiedBadge}>
                      <Feather name="shield" size={11} color={PASTEL_PALETTE.accentDeep} />
                      <Text style={styles.badgeText}>
                        {verified ? 'Đã xác thực' : 'Chưa kích hoạt'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.profileEditButton}
                  activeOpacity={0.82}
                  onPress={() => {
                    setEditingName(displayName)
                    setIsEditingUsername(true)
                  }}
                >
                  <Feather name="edit-2" size={15} color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.profileEditButtonText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileModalCard}>
                <InfoRow icon="mail" label="Email" value={displayEmail} />
                <InfoRow icon="credit-card" label="Số tài khoản" value={accountNumber} />
                <InfoRow icon="calendar" label="Ngày tạo tài khoản" value={createdAtLabel} isLast />
              </View>
            </ScrollView>
          )}
          </Animated.View>

          {isEditingUsername ? (
            <View style={styles.profileEditOverlay}>
              <Pressable
                style={styles.profileEditBackdrop}
                onPress={() => {
                  Keyboard.dismiss()
                  setIsEditingUsername(false)
                }}
              />
              <View style={styles.profileEditCard}>
                <View style={styles.profileEditHeader}>
                  <View>
                    <Text style={styles.profileEditTitle}>Chỉnh sửa hồ sơ</Text>
                    <Text style={styles.profileEditSubtitle}>Cập nhật ảnh và tên hiển thị</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.profileEditClose}
                    onPress={() => {
                      Keyboard.dismiss()
                      setIsEditingUsername(false)
                    }}
                  >
                    <Feather name="x" size={18} color={PASTEL_PALETTE.title} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.profileEditAvatar}
                  activeOpacity={0.8}
                  onPress={handlePickAvatar}
                  disabled={isSavingAvatar}
                >
                  {isSavingAvatar ? (
                    <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
                  ) : avatarUrl ? (
                    <Image
                      source={{ uri: resolveMediaUrl(avatarUrl) }}
                      style={styles.profileAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.profileModalAvatarText}>{getInitials(displayName)}</Text>
                  )}
                  <View style={styles.profileEditCameraBadge}>
                    <Feather name="camera" size={15} color={PASTEL_PALETTE.white} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.profileEditAvatarHint}>Chạm để chọn ảnh mới</Text>

                <Text style={styles.profileEditFieldLabel}>Tên hiển thị</Text>
                <View style={styles.profileNameEditor}>
                  <Feather name="user" size={17} color={PASTEL_PALETTE.lavender} />
                  <TextInput
                    style={styles.profileNameInput}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    maxLength={50}
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveUsername}
                  />
                  <Text style={styles.profileNameCounter}>{editingName.length}/50</Text>
                </View>

                <View style={styles.profileEditActions}>
                  <TouchableOpacity
                    style={styles.profileEditCancelButton}
                    onPress={() => {
                      Keyboard.dismiss()
                      setIsEditingUsername(false)
                    }}
                    disabled={isSavingUsername}
                  >
                    <Text style={styles.profileEditCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileEditSaveButton}
                    onPress={handleSaveUsername}
                    disabled={isSavingUsername}
                  >
                    {isSavingUsername ? (
                      <ActivityIndicator size="small" color={PASTEL_PALETTE.white} />
                    ) : (
                      <>
                        <Feather name="check" size={17} color={PASTEL_PALETTE.white} />
                        <Text style={styles.profileEditSaveText}>Lưu thay đổi</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
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
