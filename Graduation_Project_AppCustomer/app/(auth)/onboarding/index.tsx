import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { styles } from '@/features/auth/styles/onboarding.styles'
import { useRouter } from 'expo-router'

const STEPS = [
  {
    image: require('../../../assets/images/onboarding/step-1.png'),
    title: 'Khó khăn quản lý chi tiêu?',
    subtitle:
      'Hóa đơn, tiền mặt và chi tiêu hàng ngày dễ khiến bạn rối nếu không có công cụ hỗ trợ.',
  },
  {
    image: require('../../../assets/images/onboarding/step-2.png'),
    title: 'SmartSpend đồng hành cùng bạn',
    subtitle: 'Theo dõi chi tiêu rõ ràng và từng bước làm chủ tài chính cá nhân.',
  },
  {
    image: require('../../../assets/images/onboarding/step-3.png'),
    title: 'Quản lý tài chính thông minh',
    subtitle: 'Lập ngân sách, phân tích dòng tiền và trợ lý AI giúp bạn tối ưu mỗi ngày.',
  },
] as const

const HOLD_MS = 2200
const CROSSFADE_MS = 750

export default function OnboardingScreen() {
  const router = useRouter()
  const stepRef = useRef(0)
  const [canStartPin, setCanStartPin] = useState(false)
  const imageOpacities = useRef(STEPS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current
  const textOpacities = useRef(STEPS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current
  const buttonOpacity = useRef(new Animated.Value(0)).current
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let cancelled = false

    const clearTimers = () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(resolve, ms)
        timeoutsRef.current.push(id)
      })

    const crossfadeTo = (next: number) =>
      new Promise<void>((resolve) => {
        const prev = stepRef.current
        if (prev === next) {
          resolve()
          return
        }

        Animated.parallel([
          Animated.timing(imageOpacities[prev], {
            toValue: 0,
            duration: CROSSFADE_MS,
            useNativeDriver: true,
          }),
          Animated.timing(imageOpacities[next], {
            toValue: 1,
            duration: CROSSFADE_MS,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacities[prev], {
            toValue: 0,
            duration: CROSSFADE_MS,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacities[next], {
            toValue: 1,
            duration: CROSSFADE_MS,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) stepRef.current = next
          resolve()
        })
      })

    const run = async () => {
      // Fade-in nhẹ bước đầu (ảnh đã sẵn opacity 1, chỉ đảm bảo text mượt)
      imageOpacities[0].setValue(0)
      textOpacities[0].setValue(0)
      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(imageOpacities[0], {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacities[0], {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start(() => resolve())
      })

      if (cancelled) return
      await wait(HOLD_MS)
      if (cancelled) return

      await crossfadeTo(1)
      if (cancelled) return
      await wait(HOLD_MS)
      if (cancelled) return

      await crossfadeTo(2)
      if (cancelled) return

      setCanStartPin(true)
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start()
    }

    void run()

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [buttonOpacity, imageOpacities, textOpacities])

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleBottomRight]} />

      <View style={styles.screenBody}>
        <View style={[styles.textContainer, { flex: 1, justifyContent: 'center' }]}>
          <View style={styles.heroFrame}>
            {STEPS.map((item, index) => (
              <Animated.View
                key={`img-${index}`}
                style={[styles.heroLayer, { opacity: imageOpacities[index] }]}
                pointerEvents="none"
              >
                <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
              </Animated.View>
            ))}
          </View>

          <View style={styles.copyStack}>
            {STEPS.map((item, index) => (
              <Animated.View
                key={`copy-${index}`}
                style={[styles.copyLayer, { opacity: textOpacities[index] }]}
                pointerEvents="none"
              >
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View style={[styles.ctaWrap, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => router.replace('/(auth)/setup-pin')}
            disabled={!canStartPin}
          >
            <Text style={styles.buttonText}>Bắt đầu thiết lập mã PIN</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
