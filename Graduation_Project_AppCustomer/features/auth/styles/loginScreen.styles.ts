import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

/** Layout riêng cho màn đăng nhập (slider + form). */
export const loginScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  heroWrap: {
    position: 'relative',
  },
  brandOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  bottomSection: {
    backgroundColor: PASTEL_PALETTE.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    flex: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    lineHeight: 20,
  },
  loginFormContainer: {
    marginTop: 0,
  },
})
