import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '../../constants/PastelPalette'

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetWrap: {
    width: '100%',
    zIndex: 1,
  },
  modalContainer: {
    backgroundColor: PASTEL_PALETTE.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  content: {
    width: '100%',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: PASTEL_PALETTE.border,
    borderRadius: 3,
    marginBottom: 16,
    alignSelf: 'center',
  },
  pinHeader: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  pinTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  pinSubtitle: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  pinDots: {
    marginVertical: 16,
  },
  pinErrorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  forgotPinText: {
    color: PASTEL_PALETTE.accentDeep,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  keypad: {
    marginTop: 8,
    paddingBottom: 8,
  },
})
