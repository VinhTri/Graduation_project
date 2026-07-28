import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../constants/PastelPalette';
import {
  AUTH_INPUT_BG,
  AUTH_INPUT_BORDER,
  AUTH_INPUT_TEXT,
} from '../constants/authInputColors';

export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  circleTopLeft: {
    width: 250,
    height: 250,
    backgroundColor: PASTEL_PALETTE.headerStart,
    top: -50,
    left: -50,
  },
  circleMiddleRight: {
    width: 300,
    height: 300,
    backgroundColor: PASTEL_PALETTE.headerMid,
    top: 150,
    right: -100,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  bottomSection: {
    backgroundColor: PASTEL_PALETTE.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: PASTEL_PALETTE.lavender,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    flex: 1,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderBottomWidth: 0,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: PASTEL_PALETTE.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  brandLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  brandSmart: {
    color: PASTEL_PALETTE.title,
  },
  brandSpend: {
    color: PASTEL_PALETTE.accent,
  },
  brandSubtitle: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AUTH_INPUT_BORDER,
    borderRadius: 14,
    backgroundColor: AUTH_INPUT_BG,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AUTH_INPUT_TEXT,
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  primaryButton: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: PASTEL_PALETTE.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    color: PASTEL_PALETTE.textMuted,
    fontSize: 14,
  },
  linkAction: {
    color: PASTEL_PALETTE.accentDeep,
    fontSize: 14,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: PASTEL_PALETTE.accentDeep,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
});
