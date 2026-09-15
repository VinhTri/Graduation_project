export type LimitStatus = 'DISABLED' | 'ENABLED'

export type WalletResponse = {
  id: number
  name: string
  balance: number | string
  accountNumber: string | null
  isDefault: boolean
  isDeletable: boolean
  limitStatus: LimitStatus
  transactionLimit: number | string | null
  dailyLimit: number | string | null
  dailyTransactedAmount: number | string
}

export type WalletSettingsRequest = {
  enabled: boolean
  transactionLimit?: number
  dailyLimit?: number
  currentPinCode: string
}

export type WalletTransactionType = 'TOP_UP' | 'WITHDRAW'

export type WalletTransactionResponse = {
  transactionCode: string
  amount: number
  type: WalletTransactionType
  note: string | null
  categoryId: number | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  categoryBgColor: string | null
  categoryDeleted: boolean
  bankAccountId: number | null
  bankName: string | null
  bankAccountNumber: string | null
  bankCode: string | null
  bankAccountName: string | null
  balanceAfter: number | null
  createdAt: string
}

export type WalletWithdrawRequest = {
  amount: number
  bankAccountId: number
  pinCode: string
  note?: string
}
