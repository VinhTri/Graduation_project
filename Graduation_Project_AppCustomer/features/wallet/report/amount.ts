/** Parse số tiền an toàn từ number | string API. */
export function toSafeAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

