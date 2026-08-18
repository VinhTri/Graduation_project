import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { styles } from './Toast.styles'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

type ToastHostProps = {
  visible: boolean
  title?: string
  message: string
  variant: ToastVariant
  onHide: () => void
}

const VARIANT_ICON: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'alert-circle',
  error: 'close-circle',
}

const VARIANT_ICON_STYLE = {
  info: styles.infoIcon,
  success: styles.successIcon,
  warning: styles.warningIcon,
  error: styles.errorIcon,
} as const

const VARIANT_BORDER_STYLE = {
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
} as const

export function ToastHost({ visible, title, message, variant, onHide }: ToastHostProps) {
  const insets = useSafeAreaInsets()
  const [mounted, setMounted] = useState(visible)
  const opacity = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(24)).current

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 24,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false)
    })
  }, [visible, opacity, translateX])

  if (!mounted) return null

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.toast,
          VARIANT_BORDER_STYLE[variant],
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={[styles.iconWrap, VARIANT_ICON_STYLE[variant]]}>
          <Ionicons name={VARIANT_ICON[variant]} size={18} color="#FFFFFF" />
        </View>
        <View style={styles.textWrap}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>
        <Pressable onPress={onHide} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color="#6B7280" />
        </Pressable>
      </Animated.View>
    </View>
  )
}
