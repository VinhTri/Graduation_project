import AsyncStorage from '@react-native-async-storage/async-storage'
import { userService } from '@/shared/api/services/userService'
import { walletService } from '@/shared/api/services/walletService'

const SESSION_USER_ID = 'userId'
const SESSION_KEYS = ['token', 'userAvatarUrl', 'userName', 'userEmail', SESSION_USER_ID] as const

const sessionListeners = new Set<() => void>()

export type CustomerProfile = {
  id: number
  email: string
  accountNumber?: string | null
  createdAt?: string
}

export type AuthSessionPayload = {
  token: string
  id?: number | string | null
  username?: string | null
  email?: string | null
}

export function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

export function notifySessionChanged() {
  sessionListeners.forEach((fn) => fn())
}

export async function persistAuthSession(data: AuthSessionPayload): Promise<void> {
  await AsyncStorage.setItem('token', data.token)
  if (data.id != null && String(data.id).trim() !== '') {
    await AsyncStorage.setItem(SESSION_USER_ID, String(data.id))
  }
  if (data.username) {
    await AsyncStorage.setItem('userName', data.username)
  }
  if (data.email) {
    await AsyncStorage.setItem('userEmail', data.email)
  }
  notifySessionChanged()
}

export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_USER_ID)
}

export async function getCustomerProfile(): Promise<CustomerProfile> {
  const profile = await userService.getMyProfile()
  let accountNumber = profile.accountNumber ?? null

  if (!accountNumber) {
    try {
      const wallet = await walletService.getMyWallet()
      accountNumber = wallet.accountNumber ?? null
    } catch {
      // giữ null nếu không lấy được ví
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    accountNumber,
    createdAt: profile.createdAt,
  }
}

export async function logoutCustomer(): Promise<void> {
  await AsyncStorage.multiRemove([...SESSION_KEYS])
  notifySessionChanged()
}
