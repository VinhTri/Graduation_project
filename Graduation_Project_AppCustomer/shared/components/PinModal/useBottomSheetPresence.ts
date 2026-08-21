import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

const ENTER_MS = 220
const EXIT_MS = 170
const SHEET_OFFSET = 56

/** Modal full-screen không slide; chỉ sheet trượt + backdrop fade để tránh “màn đen lướt”. */
export function useBottomSheetPresence(visible: boolean) {
  const [presented, setPresented] = useState(visible)
  const presentedRef = useRef(visible)
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current
  const sheetTranslateY = useRef(new Animated.Value(visible ? 0 : SHEET_OFFSET)).current

  useEffect(() => {
    let cancelled = false
    let frame = 0
    let animation: Animated.CompositeAnimation | null = null

    if (visible) {
      presentedRef.current = true
      setPresented(true)
      backdropOpacity.setValue(0)
      sheetTranslateY.setValue(SHEET_OFFSET)

      frame = requestAnimationFrame(() => {
        if (cancelled) return
        animation = Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: ENTER_MS,
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: ENTER_MS,
            useNativeDriver: true,
          }),
        ])
        animation.start()
      })
    } else if (presentedRef.current) {
      animation = Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: EXIT_MS,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SHEET_OFFSET,
          duration: EXIT_MS,
          useNativeDriver: true,
        }),
      ])
      animation.start(({ finished }) => {
        if (!finished || cancelled) return
        presentedRef.current = false
        setPresented(false)
      })
    }

    return () => {
      cancelled = true
      if (frame) cancelAnimationFrame(frame)
      animation?.stop()
    }
  }, [visible, backdropOpacity, sheetTranslateY])

  return { presented, backdropOpacity, sheetTranslateY }
}
