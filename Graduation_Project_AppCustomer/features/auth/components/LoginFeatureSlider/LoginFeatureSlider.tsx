import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Image, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LOGIN_SLIDES } from '@/features/auth/constants/loginSlides'
import { preloadLoginSlideImages } from '@/features/auth/utils/preloadLoginSlideImages'
import { loginFeatureSliderStyles as styles } from './login-feature-slider.styles'

const SLIDE_DURATION_MS = 4500
const CROSSFADE_MS = 280

/** Carousel ảnh marketing — chỉ dùng trên màn đăng nhập. */
export default function LoginFeatureSlider() {
  const insets = useSafeAreaInsets()
  const windowHeight = Dimensions.get('window').height
  const slideHeight = Math.min(windowHeight * 0.52 + insets.top, 480)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const progress = useRef(new Animated.Value(0)).current
  const opacities = useRef(
    LOGIN_SLIDES.map((_, index) => new Animated.Value(index === 0 ? 1 : 0)),
  ).current
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    preloadLoginSlideImages().catch(() => undefined)
  }, [])

  const goToNext = useCallback(() => {
    const current = activeIndexRef.current
    const next = (current + 1) % LOGIN_SLIDES.length

    Animated.parallel([
      Animated.timing(opacities[current], {
        toValue: 0,
        duration: CROSSFADE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacities[next], {
        toValue: 1,
        duration: CROSSFADE_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return
      activeIndexRef.current = next
      setActiveIndex(next)
    })
  }, [opacities])

  useEffect(() => {
    progress.setValue(0)
    progressAnimRef.current?.stop()

    progressAnimRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: false,
    })

    progressAnimRef.current.start(({ finished }) => {
      if (finished) goToNext()
    })

    return () => progressAnimRef.current?.stop()
  }, [activeIndex, goToNext, progress])

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.topSection}>
      <View style={[styles.slideCard, { height: slideHeight }]}>
        <Image
          source={LOGIN_SLIDES[activeIndex].image}
          style={styles.slideBaseImage}
          resizeMode="cover"
          fadeDuration={0}
        />

        {LOGIN_SLIDES.map((slide, index) => (
          <Animated.View
            key={slide.id}
            style={[styles.slideLayer, { opacity: opacities[index] }]}
            pointerEvents={index === activeIndex ? 'auto' : 'none'}
          >
            <Image
              source={slide.image}
              style={styles.slideImage}
              resizeMode="cover"
              fadeDuration={0}
            />

            <LinearGradient
              colors={['transparent', 'rgba(91, 33, 182, 0.15)', 'rgba(91, 33, 182, 0.72)']}
              style={styles.captionGradient}
            >
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{slide.badge}</Text>
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            </LinearGradient>
          </Animated.View>
        ))}

        <View style={styles.storyRow}>
          {LOGIN_SLIDES.map((slide, index) => (
            <View key={slide.id} style={styles.storyTrack}>
              {index < activeIndex ? (
                <View style={[styles.storyFill, styles.storyFillComplete]} />
              ) : index === activeIndex ? (
                <Animated.View style={[styles.storyFill, { width: fillWidth }]} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
