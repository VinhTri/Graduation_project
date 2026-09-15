import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  storyCard: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  storyImage: {
    width: '100%',
    aspectRatio: 1.82,
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  storyCopy: {
    paddingHorizontal: 17,
    paddingTop: 16,
    paddingBottom: 17,
  },
  eyebrow: {
    marginBottom: 5,
    fontSize: 10,
    fontWeight: '900',
    color: PASTEL_PALETTE.accentDeep,
    letterSpacing: 0.9,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 7,
    maxWidth: 310,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    color: PASTEL_PALETTE.textMuted,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PASTEL_PALETTE.border,
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  featureDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    marginHorizontal: 12,
    backgroundColor: PASTEL_PALETTE.border,
  },
})
