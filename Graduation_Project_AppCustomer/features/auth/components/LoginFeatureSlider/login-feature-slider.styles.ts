import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const loginFeatureSliderStyles = StyleSheet.create({
  topSection: {
    paddingHorizontal: 0,
  },
  slideCard: {
    overflow: 'hidden',
    backgroundColor: PASTEL_PALETTE.title,
    position: 'relative',
  },
  storyRow: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    zIndex: 20,
    flexDirection: 'row',
    gap: 4,
  },
  storyTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  storyFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.white,
  },
  storyFillComplete: {
    width: '100%',
  },
  slideLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  slideBaseImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  captionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 34,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PASTEL_PALETTE.accentDeep,
    letterSpacing: 0.4,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PASTEL_PALETTE.white,
    marginBottom: 4,
  },
  slideSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 19,
    marginBottom: 14,
  },
})
