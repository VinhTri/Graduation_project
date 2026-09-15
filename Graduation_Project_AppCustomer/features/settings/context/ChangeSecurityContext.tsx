import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type ChangeSecurityContextValue = {
  currentPassword: string
  setCurrentPassword: (value: string) => void
  currentPin: string
  setCurrentPin: (value: string) => void
  newPin: string
  setNewPin: (value: string) => void
  clearPasswordDraft: () => void
  clearPinDraft: () => void
}

const ChangeSecurityContext = createContext<ChangeSecurityContextValue | null>(null)

export function ChangeSecurityProvider({ children }: { children: ReactNode }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')

  const value = useMemo(
    () => ({
      currentPassword,
      setCurrentPassword,
      currentPin,
      setCurrentPin,
      newPin,
      setNewPin,
      clearPasswordDraft: () => setCurrentPassword(''),
      clearPinDraft: () => {
        setCurrentPin('')
        setNewPin('')
      },
    }),
    [currentPassword, currentPin, newPin],
  )

  return (
    <ChangeSecurityContext.Provider value={value}>{children}</ChangeSecurityContext.Provider>
  )
}

export function useChangeSecurityDraft() {
  const context = useContext(ChangeSecurityContext)
  if (!context) {
    throw new Error('useChangeSecurityDraft must be used within ChangeSecurityProvider')
  }
  return context
}
