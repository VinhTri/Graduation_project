import { OTP_COUNTDOWN_SECONDS } from '@/features/auth/hooks/useOtpCountdown'

export type ForgotPasswordDraft = {
  email: string
  otp?: string
  otpExpiresAt: number
}

let draft: ForgotPasswordDraft | null = null

export function beginForgotPasswordDraft(email: string) {
  draft = {
    email: email.trim(),
    otpExpiresAt: Date.now() + OTP_COUNTDOWN_SECONDS * 1000,
  }
}

export function refreshForgotPasswordOtpExpiry() {
  if (!draft) return
  draft = {
    ...draft,
    otp: undefined,
    otpExpiresAt: Date.now() + OTP_COUNTDOWN_SECONDS * 1000,
  }
}

export function setForgotPasswordVerifiedOtp(otp: string) {
  if (!draft) return
  draft = { ...draft, otp }
}

export function getForgotPasswordDraft() {
  return draft
}

export function clearForgotPasswordDraft() {
  draft = null
}
