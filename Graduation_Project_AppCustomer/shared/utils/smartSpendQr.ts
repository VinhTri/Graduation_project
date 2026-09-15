export const SMARTSPEND_TRANSFER_QR_TYPE = 'SMARTSPEND_TRANSFER' as const
export const SMARTSPEND_TRANSFER_QR_VERSION = 1 as const

export type SmartSpendTransferQr = {
  type: typeof SMARTSPEND_TRANSFER_QR_TYPE
  version: typeof SMARTSPEND_TRANSFER_QR_VERSION
  accountNumber: string
}

export function createSmartSpendTransferQr(accountNumber: string): string {
  const payload: SmartSpendTransferQr = {
    type: SMARTSPEND_TRANSFER_QR_TYPE,
    version: SMARTSPEND_TRANSFER_QR_VERSION,
    accountNumber: accountNumber.trim(),
  }
  return JSON.stringify(payload)
}

export function parseSmartSpendTransferQr(value: string): SmartSpendTransferQr | null {
  try {
    const data = JSON.parse(value) as Partial<SmartSpendTransferQr>
    if (
      data.type !== SMARTSPEND_TRANSFER_QR_TYPE ||
      data.version !== SMARTSPEND_TRANSFER_QR_VERSION ||
      !data.accountNumber ||
      !/^\d{8,15}$/.test(data.accountNumber)
    ) {
      return null
    }
    return data as SmartSpendTransferQr
  } catch {
    return null
  }
}
