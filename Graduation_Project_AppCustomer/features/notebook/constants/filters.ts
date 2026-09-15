export type NotebookContentTab = 'history' | 'report'

export type NotebookHistoryDateFilter = 'day' | 'week' | 'month' | 'year'

export const NOTEBOOK_HISTORY_DATE_FILTERS: {
  key: NotebookHistoryDateFilter
  label: string
}[] = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'year', label: 'Năm' },
]
