import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { styles } from './SuccessModal.styles'

type SuccessModalVariant = 'default' | 'pastel'

const VARIANT_THEME: Record<
  SuccessModalVariant,
  {
    iconColor: string
    iconBg: string
    buttonBg: string
    loaderColor: string
    borderColor?: string
    shadowColor: string
  }
> = {
  default: {
    iconColor: '#EC4899',
    iconBg: '#FCE7F3',
    buttonBg: '#EC4899',
    loaderColor: '#EC4899',
    shadowColor: '#F472B6',
  },
  pastel: {
    iconColor: '#EC4899',
    iconBg: '#FCE7F3',
    buttonBg: '#F472B6',
    loaderColor: '#F472B6',
    borderColor: '#FBCFE8',
    shadowColor: '#F472B6',
  },
}

interface SuccessModalProps {
  visible: boolean
  title: string
  message: string
  isAutoClose?: boolean
  autoCloseText?: string
  confirmLabel?: string
  imageSource?: ImageSourcePropType
  variant?: SuccessModalVariant
  onClose: () => void
}

export default function SuccessModal({
  visible,
  title,
  message,
  isAutoClose = false,
  autoCloseText = 'Đang chuyển hướng...',
  confirmLabel = 'Tiếp tục',
  imageSource,
  variant = 'default',
  onClose,
}: SuccessModalProps) {
  const theme = VARIANT_THEME[variant]
  const [timeLeft, setTimeLeft] = useState(3)

  useEffect(() => {
    if (!visible || !isAutoClose) return

    setTimeLeft(3)
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [visible, isAutoClose])

  useEffect(() => {
    if (visible && isAutoClose && timeLeft === 0) {
      onClose()
    }
  }, [timeLeft, visible, isAutoClose, onClose])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalContainer,
            {
              borderWidth: theme.borderColor ? 1.5 : 0,
              borderColor: theme.borderColor,
              shadowColor: theme.shadowColor,
            },
          ]}
        >
          {imageSource ? (
            <View style={styles.heroImageWrap}>
              <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
              <Feather name="check-circle" size={40} color={theme.iconColor} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {isAutoClose ? (
            <View style={styles.autoCloseContainer}>
              <ActivityIndicator size="small" color={theme.loaderColor} />
              {!!autoCloseText && <Text style={styles.autoCloseText}>{autoCloseText}</Text>}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.buttonBg }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
