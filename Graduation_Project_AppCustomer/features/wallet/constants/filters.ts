import type { WalletHistoryDateFilter } from '../report/walletReportUtils'

export const WALLET_HISTORY_DATE_FILTERS: {
  key: WalletHistoryDateFilter
  label: string
}[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'year', label: 'Năm' },
]
