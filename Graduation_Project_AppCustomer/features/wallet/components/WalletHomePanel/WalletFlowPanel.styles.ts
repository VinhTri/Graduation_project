import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  storyCard: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  storyImage: {
    width: '100%',
    height: 190,
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  storyCopy: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 16,
  },
  eyebrow: {
    marginBottom: 5,
    fontSize: 10,
    fontWeight: '900',
    color: PASTEL_PALETTE.accentDeep,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    color: PASTEL_PALETTE.textMuted,
  },
  featureRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PASTEL_PALETTE.border,
  },
  featureItem: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  featureText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  featureDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: PASTEL_PALETTE.border,
  },
})
