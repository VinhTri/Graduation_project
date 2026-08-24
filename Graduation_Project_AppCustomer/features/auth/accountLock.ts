import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'

export type AccountLockModalState = { visible: boolean; email: string }

let modalState: AccountLockModalState = { visible: false, email: '' }
let unlockFlowActive = false
const listeners = new Set<(state: AccountLockModalState) => void>()

function publish(next: AccountLockModalState) {
  modalState = next
  listeners.forEach((listener) => listener(modalState))
}

export function getAccountLockModalState() { return modalState }

export function subscribeAccountLockModal(listener: (state: AccountLockModalState) => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function finishAccountUnlockFlow() {
  unlockFlowActive = false
  publish({ visible: false, email: '' })
}

export async function showAccountLockedAlert(email?: string | null) {
  const resolvedEmail = email?.trim()
    || await AsyncStorage.getItem('lockedAccountEmail')
    || await AsyncStorage.getItem('userEmail')
    || ''
  if (resolvedEmail) await AsyncStorage.setItem('lockedAccountEmail', resolvedEmail)
  if (modalState.visible || unlockFlowActive) return
  publish({ visible: true, email: resolvedEmail })
}

export function continueAccountUnlock() {
  if (!modalState.visible || unlockFlowActive) return
  const email = modalState.email
  unlockFlowActive = true
  publish({ visible: false, email })
  router.replace({
    pathname: '/(auth)/unlock',
    params: { email, autoSend: 'true' },
  })
}
