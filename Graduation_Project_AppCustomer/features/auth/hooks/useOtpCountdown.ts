import { useCallback, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { useFocusEffect } from 'expo-router'

export const OTP_COUNTDOWN_SECONDS = 300

function getSecondsLeft(expiresAt: number | null): number {
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
}

/** Đếm ngược OTP theo thời gian thực — không bị dừng khi rời màn hình. */
export function useOtpCountdown(expiresAt: number | null) {
  const [timeLeft, setTimeLeft] = useState(() => getSecondsLeft(expiresAt))

  const syncTimeLeft = useCallback(() => {
    setTimeLeft(getSecondsLeft(expiresAt))
  }, [expiresAt])

  useFocusEffect(
    useCallback(() => {
      syncTimeLeft()
    }, [syncTimeLeft]),
  )

  useEffect(() => {
    syncTimeLeft()
  }, [syncTimeLeft])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') syncTimeLeft()
    })
    return () => subscription.remove()
  }, [syncTimeLeft])

  useEffect(() => {
    const timer = setInterval(syncTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [syncTimeLeft])

  return timeLeft
}
