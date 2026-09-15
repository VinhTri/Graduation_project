export type AuthResponse = {
  token: string
  type: string
  id: number
  username?: string
  email: string
  role: string
  moneySuffix?: 'dong' | 'vnd'
  moneySeparator?: 'dot' | 'comma'
  setupCompleted: boolean
  accountNumberSetup: boolean
  pinSetup: boolean
  securityLocked?: boolean
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  otp: string
}

export type SendOtpRequest = {
  email: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type VerifyPasswordRequest = {
  currentPassword: string
}

export type VerifyPinRequest = {
  currentPinCode: string
}

export type ChangePinRequest = {
  currentPinCode: string
  newPinCode: string
  confirmPinCode: string
}
