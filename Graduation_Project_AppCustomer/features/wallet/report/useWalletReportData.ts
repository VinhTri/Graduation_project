import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { getCategories } from '@/shared/services/category.service'
import { getWalletTransactions } from '@/shared/services/wallet.service'
import type { CategoryGroup } from '@/shared/types/category'
import {
  mapWalletReportTransaction,
  type WalletReportTx,
} from './walletReportUtils'

/**
 * Data loader riêng cho báo cáo ví SmartSpend.
 * Không dùng chung state / module báo cáo sổ tay.
 */
export function useWalletReportData(enabled: boolean) {
  const [transactions, setTransactions] = useState<WalletReportTx[]>([])
  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [history, categoryGroups] = await Promise.all([
      getWalletTransactions(),
      getCategories(),
    ])
    setTransactions(history.map(mapWalletReportTransaction))
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
          Alert.alert('Lỗi', e?.message || 'Không tải được báo cáo ví')
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
      Alert.alert('Lỗi', e?.message || 'Không làm mới được báo cáo ví')
    } finally {
      setRefreshing(false)
    }
  }, [load])

  return { transactions, categories, loading, refreshing, refresh }
}
