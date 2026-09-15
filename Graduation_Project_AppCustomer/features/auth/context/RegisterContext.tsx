import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { OTP_COUNTDOWN_SECONDS } from '@/features/auth/hooks/useOtpCountdown'

type RegisterContextValue = {
  email: string
  password: string
  otpExpiresAt: number | null
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  startOtpCountdown: () => void
  reset: () => void
}

const RegisterContext = createContext<RegisterContextValue | null>(null)

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)

  const value = useMemo(
    () => ({
      email,
      password,
      otpExpiresAt,
      setEmail,
      setPassword,
      startOtpCountdown: () => {
        setOtpExpiresAt(Date.now() + OTP_COUNTDOWN_SECONDS * 1000)
      },
      reset: () => {
        setEmail('')
        setPassword('')
        setOtpExpiresAt(null)
      },
    }),
    [email, password, otpExpiresAt],
  )

  return <RegisterContext.Provider value={value}>{children}</RegisterContext.Provider>
}

export function useRegisterDraft() {
  const context = useContext(RegisterContext)
  if (!context) {
    throw new Error('useRegisterDraft must be used within RegisterProvider')
  }
  return context
}
