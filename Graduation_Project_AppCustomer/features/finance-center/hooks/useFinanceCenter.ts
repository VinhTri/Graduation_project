import { useCallback, useEffect, useState } from 'react'
import {
  reportService,
  type FinanceCenterPeriod,
  type FinanceCenterResponse,
} from '@/shared/api/services/reportService'
import { emptyFinanceCenter, previousPeriodDate, toIsoDate } from '../utils'

export function useFinanceCenter(
  period: FinanceCenterPeriod,
  date: Date,
  compareDate: Date,
  enabled: boolean,
) {
  const [data, setData] = useState<FinanceCenterResponse>(() =>
    emptyFinanceCenter(period, date, compareDate),
  )
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await reportService.getFinanceCenter(
      period,
      toIsoDate(date),
      toIsoDate(compareDate),
    )
    if (!result?.current || !result?.compare || !result?.delta) {
      throw new Error('Không tải được trung tâm tài chính')
    }
    setData({
      ...result,
      budget: result.budget ?? emptyFinanceCenter(period, date, compareDate).budget,
    })
    setError(null)
  }, [period, date, compareDate])

  useEffect(() => {
    if (!enabled) return
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        await load()
      } catch (e: any) {
        if (active) {
          setError(e?.message || 'Không tải được trung tâm tài chính')
          setData(emptyFinanceCenter(period, date, compareDate))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [enabled, load, period, date, compareDate])

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Không tải được trung tâm tài chính')
    } finally {
      setRefreshing(false)
    }
  }, [load])

  return { data, loading, refreshing, error, refresh }
}

export { previousPeriodDate }
