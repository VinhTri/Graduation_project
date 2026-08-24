import type { CommonBank } from '@/shared/types/bankAccount'

/** Logo từ VietQR CDN — nếu lỗi mạng sẽ fallback chữ viết tắt trên UI. */
export const COMMON_BANKS: CommonBank[] = [
  { code: '970422', name: 'MBBank', shortName: 'MB', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: '970436', name: 'Vietcombank', shortName: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: '970418', name: 'BIDV', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: '970432', name: 'VPBank', shortName: 'VPB', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: '970423', name: 'TPBank', shortName: 'TPB', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: '970415', name: 'VietinBank', shortName: 'ICB', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: '970405', name: 'Agribank', shortName: 'VBA', logo: 'https://api.vietqr.io/img/VBA.png' },
  { code: '970403', name: 'Sacombank', shortName: 'STB', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: '970416', name: 'ACB', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: '970441', name: 'VIB', shortName: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: '970443', name: 'SHB', shortName: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
]

export function getBankMeta(bankCode: string) {
  return COMMON_BANKS.find((bank) => bank.code === bankCode)
}

export function getBankMetaByName(bankName?: string | null) {
  if (!bankName) return undefined
  const normalized = bankName.trim().toLowerCase()
  return COMMON_BANKS.find(
    (bank) =>
      bank.name.toLowerCase() === normalized ||
      bank.shortName.toLowerCase() === normalized ||
      normalized.includes(bank.name.toLowerCase()) ||
      normalized.includes(bank.shortName.toLowerCase()),
  )
}

export function getBankShortName(bankCode: string, fallbackName?: string) {
  return getBankMeta(bankCode)?.shortName ?? fallbackName?.slice(0, 3).toUpperCase() ?? 'NH'
}
