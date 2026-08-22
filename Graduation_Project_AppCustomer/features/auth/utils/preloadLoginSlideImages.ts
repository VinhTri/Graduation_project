import { Image } from 'react-native'
import { LOGIN_SLIDES } from '@/features/auth/constants/loginSlides'

import { Asset } from 'expo-asset'

let preloadPromise: Promise<void> | null = null

/** Prefetch ảnh slider login — gọi sớm để không bị trắng khi quay lại màn đăng nhập. */
export function preloadLoginSlideImages(): Promise<void> {
  if (preloadPromise) return preloadPromise

  preloadPromise = Promise.all(
    LOGIN_SLIDES.map((slide) => {
      let uri = ''
      try {
        const asset = Asset.fromModule(slide.image)
        uri = asset.uri || ''
      } catch (e) {
        // Fallback for cases where asset module can't be resolved synchronously
      }
      
      if (uri) {
        return Image.prefetch(uri).catch(() => undefined)
      }
      return Promise.resolve()
    }),
  ).then(() => undefined)

  return preloadPromise
}

preloadLoginSlideImages()
