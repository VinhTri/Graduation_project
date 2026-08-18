import { useState } from 'react'
import { Image, StyleSheet, Text, View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

type BankLogoProps = {
  uri?: string | null
  shortName?: string
  size?: number
  style?: StyleProp<ImageStyle | ViewStyle>
}

export function BankLogo({ uri, shortName = 'NH', size = 40, style }: BankLogoProps) {
  const [failed, setFailed] = useState(false)
  const label = shortName.slice(0, 3).toUpperCase()

  if (!uri || failed) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size * 0.25 }, style]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.28 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    )
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.logo, { width: size, height: size, borderRadius: size * 0.2 }, style as ImageStyle]}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  )
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
  },
  fallbackText: {
    fontWeight: '800',
    color: PASTEL_PALETTE.subtitle,
  },
})
