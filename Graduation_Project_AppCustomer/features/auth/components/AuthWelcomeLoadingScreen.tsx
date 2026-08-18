import { useEffect, useRef } from 'react'
import { Animated, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

const LOADING_DURATION_MS = 20000
const WELCOME_IMAGE = require('../../../assets/images/welcome-loading.png')

type AuthWelcomeLoadingScreenProps = {
  headline: string
  message: string
  onComplete?: () => void | Promise<void>
  resolveNextRoute?: () => Href | Promise<Href>
}

export default function AuthWelcomeLoadingScreen({
  headline,
  message,
  onComplete,
  resolveNextRoute,
}: AuthWelcomeLoadingScreenProps) {
  const router = useRouter()
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let cancelled = false
    const routePromise = resolveNextRoute
      ? resolveNextRoute()
      : Promise.resolve('/(tabs)/home' as Href)

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: LOADING_DURATION_MS,
      useNativeDriver: false,
    })

    animation.start(async ({ finished }) => {
      if (!finished || cancelled) return

      await onComplete?.()
      const nextRoute = await routePromise
      if (!cancelled) router.replace(nextRoute)
    })

    return () => {
      cancelled = true
      animation.stop()
    }
  }, [onComplete, progress, resolveNextRoute, router])

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={WELCOME_IMAGE} style={styles.hero} resizeMode="contain" />
        <Text style={styles.brand}>
          <Text style={styles.brandSmart}>Smart</Text>
          <Text style={styles.brandSpend}>Spend</Text>
        </Text>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  hero: {
    width: 188,
    height: 188,
    marginBottom: 18,
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  brandSmart: {
    color: PASTEL_PALETTE.title,
  },
  brandSpend: {
    color: PASTEL_PALETTE.accent,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: PASTEL_PALETTE.accentDeep,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
    color: PASTEL_PALETTE.subtitle,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  progressWrap: {
    paddingHorizontal: 48,
    paddingBottom: 56,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.accentDeep,
  },
})
