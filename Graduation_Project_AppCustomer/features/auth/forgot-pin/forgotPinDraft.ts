import { OTP_COUNTDOWN_SECONDS } from '@/features/auth/hooks/useOtpCountdown'

export type ForgotPinDraft = {
  email: string
  otp?: string
  otpExpiresAt: number
}

let draft: ForgotPinDraft | null = null

export function beginForgotPinDraft(email: string) {
  draft = {
    email: email.trim(),
    otpExpiresAt: Date.now() + OTP_COUNTDOWN_SECONDS * 1000,
  }
}

export function refreshForgotPinOtpExpiry() {
  if (!draft) return
  draft = {
    ...draft,
    otp: undefined,
    otpExpiresAt: Date.now() + OTP_COUNTDOWN_SECONDS * 1000,
  }
}

export function setForgotPinVerifiedOtp(otp: string) {
  if (!draft) return
  draft = { ...draft, otp }
}

export function getForgotPinDraft() {
  return draft
}

export function clearForgotPinDraft() {
  draft = null
}
