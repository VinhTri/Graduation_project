import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter, useSegments } from 'expo-router'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBudgets } from '@/shared/services/budget.service'
import type { BudgetResponse } from '@/shared/types/budget'
import { BudgetCard } from '../components/BudgetCard'
import { BudgetStatusTabs } from '../components/BudgetStatusTabs'
import { BudgetSummary } from '../components/BudgetSummary'
import { BUDGET_STATUS_TABS } from '../constants/status'
import { styles } from './budget.styles'

const PAGE_WIDTH = Dimensions.get('window').width

export default function BudgetListScreen() {
  const router = useRouter()
  const segments = useSegments()
  const isTabRoot = segments[0] === '(tabs)'
  const pagerRef = useRef<ScrollView>(null)
  const [budgets, setBudgets] = useState<BudgetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const hasLoadedOnce = useRef(false)
  const currentPeriod = useMemo(() => {
    const now = new Date()
    return `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  }, [])

  const load = useCallback(async () => {
    const showSpinner = !hasLoadedOnce.current
    try {
      if (showSpinner) setError('')
      setBudgets(await getBudgets())
      hasLoadedOnce.current = true
      setError('')
    } catch (err) {
      if (!hasLoadedOnce.current) {
        setError(err instanceof Error ? err.message : 'Không tải được ngân sách')
      }
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const pages = useMemo(
    () =>
      BUDGET_STATUS_TABS.map((status) => ({
        status,
        data: budgets.filter((b) => b.status === status),
      })),
    [budgets],
  )

  function goToPage(index: number) {
    setPageIndex(index)
    pagerRef.current?.scrollTo({ x: index * PAGE_WIDTH, animated: true })
  }

  function onPagerScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH)
    if (next !== pageIndex && next >= 0 && next < BUDGET_STATUS_TABS.length) {
      setPageIndex(next)
    }
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell
        contentStyle={styles.dashboardHeaderContent}
        coverImage={require('../../../assets/images/budget-list-header.png')}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.headerEyebrowRow}>
            {!isTabRoot ? (
              <TouchableOpacity style={styles.dashboardBackBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back-outline" size={22} color="#6D4AAF" />
              </TouchableOpacity>
            ) : null}
            <View style={styles.headerMark}>
              <Ionicons name="analytics-outline" size={15} color="#6D4AAF" />
            </View>
            <Text style={styles.headerEyebrow}>KẾ HOẠCH CHI TIÊU</Text>
          </View>
          <TouchableOpacity
            style={styles.headerCreateBtn}
            onPress={() => router.push('/budget/create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={24} color={PASTEL_PALETTE.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.dashboardTitle}>Ngân sách của bạn</Text>
        <Text style={styles.dashboardSubtitle}>Nắm rõ số tiền còn lại trước mỗi quyết định chi tiêu.</Text>

      </PastelHeaderShell>

      {loading ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.summaryPad}>
            <BudgetSummary budgets={budgets} periodLabel={currentPeriod} />
          </View>

          <BudgetStatusTabs activeIndex={pageIndex} onChange={goToPage} />

          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPagerScrollEnd}
            style={styles.pager}
            keyboardShouldPersistTaps="handled"
          >
            {pages.map((page) => (
              <View key={page.status} style={[styles.page, { width: PAGE_WIDTH }]}>
                <FlatList
                  data={page.data}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.pageListContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyTitle}>
                        {budgets.length === 0
                          ? 'Chưa có ngân sách'
                          : 'Không có mục ở tab này'}
                      </Text>
                      <Text style={styles.emptyText}>
                        {budgets.length === 0
                          ? 'Tạo hạn mức cho danh mục để theo dõi chi tiêu sổ tay tiền mặt và/hoặc ví SmartSpend.'
                          : 'Vuốt sang tab khác để xem ngân sách theo trạng thái.'}
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <BudgetCard
                      budget={item}
                      onPress={() =>
                        router.push({
                          pathname: '/budget/[id]',
                          params: { id: String(item.id) },
                        })
                      }
                    />
                  )}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
