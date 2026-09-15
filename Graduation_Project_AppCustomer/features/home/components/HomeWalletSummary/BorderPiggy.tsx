import { useCallback } from 'react'
import { StyleSheet, View, type ImageStyle, type LayoutChangeEvent } from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated'

const PIG_SIZE = 30
const LAP_MS = 13000
const PIG_SOURCE = require('../../../../assets/images/border-piggy.png')

export function useBorderPiggy(radius: number) {
  const progress = useSharedValue(0)
  const opacity = useSharedValue(0)
  const boxW = useSharedValue(0)
  const boxH = useSharedValue(0)

  const playLap = useCallback(() => {
    cancelAnimation(progress)
    cancelAnimation(opacity)
    progress.value = 0
    opacity.value = 1
    progress.value = withTiming(1, { duration: LAP_MS, easing: Easing.linear }, (finished) => {
      if (finished) {
        opacity.value = withTiming(0, { duration: 280 })
      }
    })
  }, [opacity, progress])

  const pigStyle = useAnimatedStyle(() => {
    const t = progress.value
    const w = boxW.value
    const h = boxH.value
    const rr = Math.max(1, Math.min(radius, w / 2, h / 2))
    const straightW = Math.max(0, w - 2 * rr)
    const straightH = Math.max(0, h - 2 * rr)
    const arc = (Math.PI / 2) * rr
    const total = 2 * straightW + 2 * straightH + 4 * arc

    let x = 0
    let y = 0
    let angle = 0

    if (total > 0 && w > 0 && h > 0) {
      let d = (((t % 1) + 1) % 1) * total

      if (d <= straightW) {
        x = rr + d
        y = 0
        angle = 0
      } else {
        d -= straightW
        if (d <= arc) {
          const a = d / rr
          const ang = -Math.PI / 2 + a
          x = w - rr + Math.cos(ang) * rr
          y = rr + Math.sin(ang) * rr
          angle = a
        } else {
          d -= arc
          if (d <= straightH) {
            x = w
            y = rr + d
            angle = Math.PI / 2
          } else {
            d -= straightH
            if (d <= arc) {
              const a = d / rr
              x = w - rr + Math.cos(a) * rr
              y = h - rr + Math.sin(a) * rr
              angle = Math.PI / 2 + a
            } else {
              d -= arc
              if (d <= straightW) {
                x = w - rr - d
                y = h
                angle = Math.PI
              } else {
                d -= straightW
                if (d <= arc) {
                  const a = d / rr
                  const ang = Math.PI / 2 + a
                  x = rr + Math.cos(ang) * rr
                  y = h - rr + Math.sin(ang) * rr
                  angle = Math.PI + a
                } else {
                  d -= arc
                  if (d <= straightH) {
                    x = 0
                    y = h - rr - d
                    angle = (3 * Math.PI) / 2
                  } else {
                    d -= straightH
                    const a = d / rr
                    const ang = Math.PI + a
                    x = rr + Math.cos(ang) * rr
                    y = rr + Math.sin(ang) * rr
                    angle = (3 * Math.PI) / 2 + a
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      opacity: w > 0 ? opacity.value : 0,
      transform: [
        { translateX: x - PIG_SIZE / 2 },
        { translateY: y - PIG_SIZE / 2 },
        { rotate: `${angle}rad` },
      ],
    }
  })

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    boxW.value = width
    boxH.value = height
  }

  return { pigStyle, onLayout, playLap }
}

export function BorderPiggy({ pigStyle }: { pigStyle: AnimatedStyle<ImageStyle> }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.Image
        source={PIG_SOURCE}
        style={[styles.pig, pigStyle]}
        resizeMode="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  pig: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIG_SIZE,
    height: PIG_SIZE,
    zIndex: 8,
  },
})
