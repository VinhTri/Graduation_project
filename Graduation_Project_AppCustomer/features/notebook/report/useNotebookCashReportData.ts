import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import {
  getCashNotebook,
  getNotebookTransactions,
} from '@/shared/services/notebook.service'
import { getCategories } from '@/shared/services/category.service'
import type { CategoryGroup } from '@/shared/types/category'
import {
  mapNotebookTransaction,
  type NotebookTransactionItem,
} from '../utils/notebookMappers'

/**
 * Data loader riêng cho báo cáo sổ tay tiền mặt.
 * Không dùng chung state lịch sử / báo cáo ví SmartSpend.
 */
export function useNotebookCashReportData(enabled: boolean) {
  const [transactions, setTransactions] = useState<NotebookTransactionItem[]>([])
  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const book = await getCashNotebook()
    const [history, categoryGroups] = await Promise.all([
      getNotebookTransactions(book.id, 'YEAR'),
      getCategories(),
    ])
    setTransactions(history.map(mapNotebookTransaction))
    setCategories(categoryGroups)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        await load()
      } catch (e: any) {
        if (active) {
          Alert.alert('Lỗi', e?.message || 'Không tải được báo cáo sổ tay')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [enabled, load])

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await load()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không làm mới được báo cáo sổ tay')
    } finally {
      setRefreshing(false)
    }
  }, [load])

  return { transactions, categories, loading, refreshing, refresh }
}