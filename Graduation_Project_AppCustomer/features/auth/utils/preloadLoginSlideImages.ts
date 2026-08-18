import { Image } from 'react-native'
import { LOGIN_SLIDES } from '@/features/auth/constants/loginSlides'

let preloadPromise: Promise<void> | null = null

/** Prefetch ảnh slider login — gọi sớm để không bị trắng khi quay lại màn đăng nhập. */
export function preloadLoginSlideImages(): Promise<void> {
  if (preloadPromise) return preloadPromise

  preloadPromise = Promise.all(
    LOGIN_SLIDES.map((slide) => {
      const asset = Image.resolveAssetSource(slide.image)
      if (asset?.uri) {
        return Image.prefetch(asset.uri).catch(() => undefined)
      }
      return Promise.resolve()
    }),
  ).then(() => undefined)

  return preloadPromise
}

preloadLoginSlideImages()
