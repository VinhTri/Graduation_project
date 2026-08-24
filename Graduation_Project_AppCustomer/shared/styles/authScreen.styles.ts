import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../constants/PastelPalette';
import {
  AUTH_INPUT_BG,
  AUTH_INPUT_BORDER,
  AUTH_INPUT_TEXT,
} from '../constants/authInputColors';

/** Styles dùng chung cho form auth (đăng nhập, đăng ký, quên mật khẩu). */
export const authScreenStyles = StyleSheet.create({
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
  inputContainerInvalid: {
    borderColor: '#EF4444',
    borderLeftWidth: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AUTH_INPUT_TEXT,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    alignSelf: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
  },
  linkAction: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
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
