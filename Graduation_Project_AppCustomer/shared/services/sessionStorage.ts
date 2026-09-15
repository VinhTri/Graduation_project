import AsyncStorage from '@react-native-async-storage/async-storage'

export const SESSION_STORAGE_KEYS = [
  'token',
  'userAvatarUrl',
  'userName',
  'userEmail',
  'userId',
] as const

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.multiRemove([...SESSION_STORAGE_KEYS])
}
