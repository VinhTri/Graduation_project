export type CurrencySuffix = 'dong' | 'vnd'
export type ThousandSeparator = 'dot' | 'comma'

export type MoneyFormatPrefs = {
  suffix: CurrencySuffix
  separator: ThousandSeparator
}

export const DEFAULT_MONEY_FORMAT: MoneyFormatPrefs = {
  suffix: 'dong',
  separator: 'comma',
}

export const LEGACY_MONEY_FORMAT_KEY = '@smartspend_money_format'
const LEGACY_MIGRATED_KEY = '@smartspend_money_format:legacy_migrated'

let currentPrefs: MoneyFormatPrefs = { ...DEFAULT_MONEY_FORMAT }
const listeners = new Set<() => void>()

export function getMoneyFormatStorageKey(userId?: string | number | null) {
  if (userId == null || String(userId).trim() === '') {
    return LEGACY_MONEY_FORMAT_KEY
  }
  return `@smartspend_money_format:user:${userId}`
}

export function getMoneyFormatLegacyMigratedKey() {
  return LEGACY_MIGRATED_KEY
}

export function getMoneyFormatPrefs(): MoneyFormatPrefs {
  return currentPrefs
}

export function setMoneyFormatPrefs(next: MoneyFormatPrefs) {
  currentPrefs = next
  listeners.forEach((fn) => fn())
}

export function subscribeMoneyFormat(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getCurrencySuffix(prefs: MoneyFormatPrefs = currentPrefs) {
  return prefs.suffix === 'vnd' ? 'VND' : 'đ'
}

export function formatAmount(value: number, prefs: MoneyFormatPrefs = currentPrefs) {
  const n = Math.round(Number.isFinite(value) ? value : 0)
  const grouped = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const signed = n < 0 ? `-${grouped}` : grouped
  if (prefs.separator === 'dot') {
    return signed.replace(/,/g, '.')
  }
  return signed
}

export function formatMoney(value: number, prefs: MoneyFormatPrefs = currentPrefs) {
  const amount = formatAmount(value, prefs)
  const suffix = getCurrencySuffix(prefs)
  return prefs.suffix === 'vnd' ? `${amount} ${suffix}` : `${amount}${suffix}`
}

export function formatCompactAmount(value: number) {
  const amount = Number.isFinite(value) ? value : 0
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')}tỷ`
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}tr`
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k`
  }
  return String(Math.round(amount))
}

export function formatAmountInput(text: string, prefs: MoneyFormatPrefs = currentPrefs) {
  const digits = text.replace(/[^\d]/g, '').slice(0, 12)
  if (!digits) return ''
  return formatAmount(Number(digits), prefs)
}

export function prefsFromApi(input?: {
  suffix?: string | null
  separator?: string | null
  moneySuffix?: string | null
  moneySeparator?: string | null
} | null): MoneyFormatPrefs {
  const suffix = input?.suffix ?? input?.moneySuffix
  const separator = input?.separator ?? input?.moneySeparator
  return {
    suffix: suffix === 'vnd' ? 'vnd' : 'dong',
    separator: separator === 'dot' ? 'dot' : 'comma',
  }
}
