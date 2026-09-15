import { useState } from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
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

const ICON = PASTEL_PALETTE.accentDeep

function WalletSubItems({ onLimitSettings }: { onLimitSettings: () => void }) {
  return (
    <View style={styles.securitySubList}>
      <TouchableOpacity
        style={[styles.securitySubItem, { borderBottomWidth: 0 }]}
        activeOpacity={0.75}
        onPress={onLimitSettings}
      >
        <View style={styles.securitySubIcon}>
          <Ionicons name="speedometer-outline" size={16} color={ICON} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Thiết lập hạn mức ví</Text>
          <Text style={styles.itemSubtitle}>Giới hạn mỗi giao dịch và theo ngày</Text>
        </View>
        <Feather name="chevron-right" size={16} color={PASTEL_PALETTE.lavender} />
      </TouchableOpacity>
    </View>
  )
}

export function WalletSmartSpendSection() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState(0)
  const progress = useSharedValue(0)

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
    <>
      <Pressable
        style={[
          styles.itemContainer,
          { borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0 },
        ]}
        onPress={toggle}
        android_ripple={{ color: PASTEL_PALETTE.accentSoft }}
      >
        <View style={styles.itemIconContainer}>
          <Ionicons name="wallet-outline" size={20} color={ICON} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Ví SmartSpend</Text>
          <Text style={styles.itemSubtitle}>Số dư và hạn mức ví</Text>
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
        <WalletSubItems onLimitSettings={() => router.push('/wallet/limit-settings')} />
      </View>

      <Animated.View style={[styles.securityCollapse, panelStyle]}>
        <WalletSubItems onLimitSettings={() => router.push('/wallet/limit-settings')} />
      </Animated.View>
    </>
  )
}
