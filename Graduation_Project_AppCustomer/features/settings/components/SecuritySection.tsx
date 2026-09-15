import { useState } from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { styles } from '../SettingsScreen.styles'

const ANIM_CONFIG = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
}

function SecuritySubItems({
  onPassword,
  onPin,
}: {
  onPassword: () => void
  onPin: () => void
}) {
  return (
    <View style={styles.securitySubList}>
      <TouchableOpacity style={styles.securitySubItem} activeOpacity={0.75} onPress={onPassword}>
        <View style={styles.securitySubIcon}>
          <Feather name="lock" size={16} color={PASTEL_PALETTE.accentDeep} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Đổi mật khẩu</Text>
          <Text style={styles.itemSubtitle}>Cập nhật mật khẩu đăng nhập</Text>
        </View>
        <Feather name="chevron-right" size={16} color={PASTEL_PALETTE.lavender} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.securitySubItem, { borderBottomWidth: 0 }]}
        activeOpacity={0.75}
        onPress={onPin}
      >
        <View style={styles.securitySubIcon}>
          <Feather name="key" size={16} color={PASTEL_PALETTE.accentDeep} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Đổi mã PIN</Text>
          <Text style={styles.itemSubtitle}>Cập nhật PIN bảo mật giao dịch</Text>
        </View>
        <Feather name="chevron-right" size={16} color={PASTEL_PALETTE.lavender} />
      </TouchableOpacity>
    </View>
  )
}

export function SecuritySection() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState(0)
  const progress = useSharedValue(0)

  const goChangePassword = () => router.push('/settings/change-password/current')
  const goChangePin = () => router.push('/settings/change-pin/current')

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    progress.value = withTiming(next ? 1 : 0, ANIM_CONFIG)
  }

  const panelStyle = useAnimatedStyle(() => {
    const h = measuredHeight > 0 ? measuredHeight : 0
    return {
      height: progress.value * h,
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.55, 1]),
      transform: [{ translateY: interpolate(progress.value, [0, 1], [-6, 0]) }],
    }
  })

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }))

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bảo mật</Text>
      </View>

      <View style={styles.sectionBody}>
        <Pressable
          style={[
            styles.itemContainer,
            { borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0 },
          ]}
          onPress={toggle}
          android_ripple={{ color: PASTEL_PALETTE.accentSoft }}
        >
          <View style={styles.itemIconContainer}>
            <Feather name="shield" size={19} color={PASTEL_PALETTE.accentDeep} />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Bảo mật tài khoản</Text>
            <Text style={styles.itemSubtitle}>Mật khẩu, mã PIN</Text>
          </View>
          <Animated.View style={chevronStyle}>
            <Feather name="chevron-down" size={18} color={PASTEL_PALETTE.lavender} />
          </Animated.View>
        </Pressable>

        <View
          style={styles.securityMeasure}
          pointerEvents="none"
          onLayout={(e) => {
            const next = Math.ceil(e.nativeEvent.layout.height)
            if (next > 0 && next !== measuredHeight) setMeasuredHeight(next)
          }}
        >
          <SecuritySubItems onPassword={goChangePassword} onPin={goChangePin} />
        </View>

        <Animated.View style={[styles.securityCollapse, panelStyle]}>
          <SecuritySubItems onPassword={goChangePassword} onPin={goChangePin} />
        </Animated.View>
      </View>
    </View>
  )
}
