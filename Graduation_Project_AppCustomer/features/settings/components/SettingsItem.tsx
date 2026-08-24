import { type ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { styles } from '../SettingsScreen.styles'

type SettingsItemProps = {
  icon?: ReactNode
  title: string
  subtitle?: string
  value?: string
  hideChevron?: boolean
  isLast?: boolean
  onPress?: () => void
}

export function SettingsItem({
  icon,
  title,
  subtitle,
  value,
  hideChevron,
  isLast,
  onPress,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.itemContainer, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress && hideChevron}
    >
      {icon ? <View style={styles.itemIconContainer}>{icon}</View> : <View style={{ width: 8 }} />}

      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.itemRight}>
        {value !== undefined ? <Text style={styles.itemValue}>{value}</Text> : null}
        {!hideChevron ? (
          <Feather name="chevron-right" size={18} color={PASTEL_PALETTE.lavender} />
        ) : null}
      </View>
    </TouchableOpacity>
  )
}
