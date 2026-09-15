import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { userService } from '@/shared/api/services/userService'
import { getStoredUserId, subscribeSession } from '@/shared/services/session.service'
import {
  DEFAULT_MONEY_FORMAT,
  formatAmount,
  formatAmountInput,
  formatMoney,
  getCurrencySuffix,
  getMoneyFormatPrefs,
  getMoneyFormatStorageKey,
  prefsFromApi,
  setMoneyFormatPrefs,
  subscribeMoneyFormat,
  type CurrencySuffix,
  type MoneyFormatPrefs,
  type ThousandSeparator,
} from '@/shared/utils/moneyFormat'

type MoneyFormatContextValue = {
  prefs: MoneyFormatPrefs
  setSuffix: (suffix: CurrencySuffix) => void
  setSeparator: (separator: ThousandSeparator) => void
  formatMoney: (value: number) => string
  formatAmount: (value: number) => string
  formatAmountInput: (text: string) => string
  suffixLabel: string
}

const MoneyFormatContext = createContext<MoneyFormatContextValue | null>(null)

function isValidPrefs(value: unknown): value is MoneyFormatPrefs {
  if (!value || typeof value !== 'object') return false
  const prefs = value as MoneyFormatPrefs
  return (
    (prefs.suffix === 'dong' || prefs.suffix === 'vnd') &&
    (prefs.separator === 'dot' || prefs.separator === 'comma')
  )
}

async function cacheLocal(userId: string, prefs: MoneyFormatPrefs) {
  await AsyncStorage.setItem(getMoneyFormatStorageKey(userId), JSON.stringify(prefs))
}

async function loadLocalPrefs(userId: string): Promise<MoneyFormatPrefs> {
  try {
    const raw = await AsyncStorage.getItem(getMoneyFormatStorageKey(userId))
    if (!raw) return { ...DEFAULT_MONEY_FORMAT }
    const parsed = JSON.parse(raw)
    return isValidPrefs(parsed) ? parsed : { ...DEFAULT_MONEY_FORMAT }
  } catch {
    return { ...DEFAULT_MONEY_FORMAT }
  }
}

export function MoneyFormatProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<MoneyFormatPrefs>(DEFAULT_MONEY_FORMAT)
  const userIdRef = useRef<string | null>(null)

  const applyPrefs = useCallback((next: MoneyFormatPrefs) => {
    setMoneyFormatPrefs(next)
    setPrefs(next)
  }, [])

  const reloadForCurrentUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        userIdRef.current = null
        applyPrefs({ ...DEFAULT_MONEY_FORMAT })
        return
      }

      try {
        const profile = await userService.getMyProfile()
        const userId = String(profile.id)
        await AsyncStorage.setItem('userId', userId)
        userIdRef.current = userId
        const next = prefsFromApi(profile)
        await cacheLocal(userId, next)
        applyPrefs(next)
      } catch {
        const userId = (await getStoredUserId()) ?? (await AsyncStorage.getItem('userEmail'))
        userIdRef.current = userId
        applyPrefs(userId ? await loadLocalPrefs(userId) : { ...DEFAULT_MONEY_FORMAT })
      }
    } catch {
      userIdRef.current = null
      applyPrefs({ ...DEFAULT_MONEY_FORMAT })
    }
  }, [applyPrefs])

  useEffect(() => {
    void reloadForCurrentUser()
    return subscribeSession(() => {
      void reloadForCurrentUser()
    })
  }, [reloadForCurrentUser])

  useEffect(() => {
    return subscribeMoneyFormat(() => {
      setPrefs(getMoneyFormatPrefs())
    })
  }, [])

  const persist = useCallback(
    async (next: MoneyFormatPrefs) => {
      applyPrefs(next)
      const userId = userIdRef.current
      if (userId) {
        try {
          await cacheLocal(userId, next)
        } catch {
          // ignore local cache errors
        }
      }
      try {
        await userService.updateMoneyFormat(next)
      } catch {
        // giữ bản local; lần đăng nhập sau sẽ lấy từ server nếu API thành công
      }
    },
    [applyPrefs],
  )

  const setSuffix = useCallback(
    (suffix: CurrencySuffix) => {
      persist({ ...prefs, suffix })
    },
    [persist, prefs],
  )

  const setSeparator = useCallback(
    (separator: ThousandSeparator) => {
      persist({ ...prefs, separator })
    },
    [persist, prefs],
  )

  const value = useMemo<MoneyFormatContextValue>(
    () => ({
      prefs,
      setSuffix,
      setSeparator,
      formatMoney: (amount) => formatMoney(amount, prefs),
      formatAmount: (amount) => formatAmount(amount, prefs),
      formatAmountInput: (text) => formatAmountInput(text, prefs),
      suffixLabel: getCurrencySuffix(prefs),
    }),
    [prefs, setSeparator, setSuffix],
  )

  return <MoneyFormatContext.Provider value={value}>{children}</MoneyFormatContext.Provider>
}

export function useMoneyFormat() {
  const ctx = useContext(MoneyFormatContext)
  if (!ctx) {
    throw new Error('useMoneyFormat phải dùng trong MoneyFormatProvider')
  }
  return ctx
}
