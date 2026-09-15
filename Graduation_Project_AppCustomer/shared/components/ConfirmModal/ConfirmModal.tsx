import React from 'react'
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'
import { PASTEL_PALETTE } from '../../constants/PastelPalette'
import { OVERLAY_PADDING_H, styles } from './ConfirmModal.styles'

interface ConfirmModalProps {
  visible: boolean
  title: string
  message?: string
  iconName?: keyof typeof Ionicons.glyphMap
  iconColor?: string
  image?: ImageSourcePropType
  imageAspectRatio?: number
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
  loading?: boolean
  children?: React.ReactNode
  hideCancel?: boolean
  confirmButtonColor?: string
}

export default function ConfirmModal({
  visible,
  title,
  message,
  iconName = 'alert-circle',
  iconColor,
  image,
  imageAspectRatio = 1024 / 643,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  isDestructive = true,
  loading = false,
  children,
  hideCancel = false,
  confirmButtonColor,
}: ConfirmModalProps) {
  const { width: windowWidth } = useWindowDimensions()
  const cardWidth = windowWidth - OVERLAY_PADDING_H * 2
  const imageHeight = cardWidth / imageAspectRatio

  if (image) {
    const confirmColor = isDestructive
      ? '#DC2626'
      : confirmButtonColor || PASTEL_PALETTE.accentDeep

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCancel}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel} />
          <View style={[styles.cardImage, { width: cardWidth }]}>
            <Image
              source={image}
              style={{ width: cardWidth, height: imageHeight }}
              resizeMode="stretch"
            />
            <View style={styles.imageBody}>
              <Text style={styles.imageTitle}>{title}</Text>
              {message ? <Text style={styles.imageMessage}>{message}</Text> : null}
              {children}
              <View style={styles.imageActions}>
                {!hideCancel ? (
                  <TouchableOpacity
                    style={styles.imageCancelButton}
                    onPress={onCancel}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Text style={styles.imageCancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.imageConfirmButton,
                    { backgroundColor: confirmColor },
                    isDestructive ? styles.imageConfirmButtonDanger : null,
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={PASTEL_PALETTE.white} />
                  ) : (
                    <Text style={styles.imageConfirmButtonText}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  const activeIconColor = iconColor || (isDestructive ? '#EC4899' : Colors.primary)
  const activeConfirmColor =
    confirmButtonColor || iconColor || (isDestructive ? '#EC4899' : Colors.primary)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlayIcon}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${activeIconColor}1A` }]}>
            <Ionicons name={iconName} size={32} color={activeIconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View style={styles.buttonRow}>
            {!hideCancel ? (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: activeConfirmColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
