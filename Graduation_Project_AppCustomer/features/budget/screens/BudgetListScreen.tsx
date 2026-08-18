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
import { useFocusEffect, useRouter } from 'expo-router'
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
  const pagerRef = useRef<ScrollView>(null)
  const [budgets, setBudgets] = useState<BudgetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const hasLoadedOnce = useRef(false)

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
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Ngân sách</Text>
            <Text style={styles.subtitle}>Theo dõi hạn mức theo danh mục</Text>
          </View>
          <TouchableOpacity
            style={styles.headerCreateBtn}
            onPress={() => router.push('/budget/create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={PASTEL_PALETTE.white} />
            <Text style={styles.headerCreateText}>Tạo</Text>
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.summaryPad}>
            <BudgetSummary budgets={budgets} />
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
