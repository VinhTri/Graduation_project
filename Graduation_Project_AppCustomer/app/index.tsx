import { Redirect, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { resolveColdStartRoute } from '@/features/auth/resolveColdStartRoute'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export default function Index() {
  const [route, setRoute] = useState<Href | null>(null)

  useEffect(() => {
    let cancelled = false
    resolveColdStartRoute()
      .then((next) => {
        if (!cancelled) setRoute(next)
      })
      .catch(() => {
        if (!cancelled) setRoute('/(auth)/login')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!route) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: PASTEL_PALETTE.white,
        }}
      >
        <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
      </View>
    )
  }

  return <Redirect href={route} />
}
