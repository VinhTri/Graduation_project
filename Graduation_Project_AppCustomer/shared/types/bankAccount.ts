export type BankAccountResponse = {
  id: number
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
  createdAt: string
}

export type LinkBankAccountRequest = {
  bankCode: string
  bankName: string
  accountNumber: string
  accountName?: string
}

export type CommonBank = {
  code: string
  name: string
  shortName: string
  logo: string
}
