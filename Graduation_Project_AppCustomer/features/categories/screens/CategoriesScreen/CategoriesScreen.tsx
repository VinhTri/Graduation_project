import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBudgets } from '@/shared/services/budget.service'
import type { BudgetResponse } from '@/shared/types/budget'
import type { CategoryItem } from '@/shared/types/category'
import { MAX_CATEGORY_GROUPS, MAX_ITEMS_PER_GROUP } from '../../constants/categoryLimits'
import { AddCategoryModal } from '../../components/AddCategoryModal/AddCategoryModal'
import { AddGroupModal } from '../../components/AddGroupModal/AddGroupModal'
import { CategoryItemRow } from '../../components/CategoryItemRow/CategoryItemRow'
import { useCategories } from '../../hooks/useCategories'
import {
  budgetsImpactedByCategories,
  budgetsImpactedByCategory,
  buildGroupDeleteMessage,
  buildItemDeleteMessage,
  uniqueCategoryLabels,
} from '../../utils/budgetDeleteImpact'
import {
  buildCategoryBudgetMap,
  getCategoryBudgetSummary,
} from '../../utils/categoryBudgetStatus'
import { styles } from './CategoriesScreen.styles'

const SETUP_STEPS = [
  {
    step: '1',
    title: 'Tạo nhóm',
    description: 'Tạo nhóm cha (VD: Sinh hoạt, Du lịch). Tối đa 6 nhóm, mỗi nhóm một màu.',
    icon: 'layers-outline' as const,
  },
  {
    step: '2',
    title: 'Thêm danh mục',
    description: 'Trong mỗi nhóm thêm tối đa 4 danh mục con. Không thể sửa — xóa rồi tạo lại.',
    icon: 'grid-outline' as const,
  },
  {
    step: '3',
    title: 'Phân loại giao dịch',
    description: 'Dùng danh mục khi ghi sổ tay để xem báo cáo theo nhóm.',
    icon: 'pie-chart-outline' as const,
  },
]

type ItemDeleteTarget = {
  id: number
  label: string
  message: string
}

type GroupDeleteTarget = {
  id: number
  title: string
  message: string
}

export default function CategoriesScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { categories, loading, addGroup, addItem, removeItem, removeGroup } = useCategories()

  const [budgets, setBudgets] = useState<BudgetResponse[]>([])
  const [itemModalVisible, setItemModalVisible] = useState(false)
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [defaultGroupId, setDefaultGroupId] = useState<number | undefined>()
  const [itemToDelete, setItemToDelete] = useState<ItemDeleteTarget | null>(null)
  const [groupToDelete, setGroupToDelete] = useState<GroupDeleteTarget | null>(null)
  const [checkingImpact, setCheckingImpact] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const budgetMap = useMemo(() => buildCategoryBudgetMap(budgets), [budgets])

  const loadBudgets = useCallback(async () => {
    try {
      setBudgets(await getBudgets())
    } catch {
      // giữ map cũ nếu lỗi mạng
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadBudgets()
    }, [loadBudgets]),
  )

  const handleCreateGroup = () => {
    if (categories.length >= MAX_CATEGORY_GROUPS) {
      showToast({
        variant: 'warning',
        message: `Bạn đã tạo tối đa ${MAX_CATEGORY_GROUPS} nhóm`,
      })
      return
    }
    setGroupModalVisible(true)
  }

  const handleAddCategoryToGroup = (groupId: number, itemCount: number) => {
    if (itemCount >= MAX_ITEMS_PER_GROUP) {
      showToast({
        variant: 'warning',
        message: `Mỗi nhóm chỉ được tối đa ${MAX_ITEMS_PER_GROUP} danh mục`,
      })
      return
    }
    setDefaultGroupId(groupId)
    setItemModalVisible(true)
  }

  async function loadBudgetsSafe(): Promise<BudgetResponse[]> {
    try {
      return await getBudgets()
    } catch {
      return []
    }
  }

  function handleSetupBudget(item: CategoryItem) {
    router.push({
      pathname: '/budget/create',
      params: {
        categoryId: String(item.id),
        categoryLabel: item.label,
        categoryIcon: item.icon,
        categoryColor: item.color,
        categoryBgColor: item.bgColor,
      },
    })
  }

  async function requestDeleteItem(target: { id: number; label: string }) {
    setCheckingImpact(true)
    try {
      const budgets = await loadBudgetsSafe()
      const impacted = budgetsImpactedByCategory(budgets, target.id)
      setItemToDelete({
        id: target.id,
        label: target.label,
        message: buildItemDeleteMessage(target.label, impacted.length > 0),
      })
    } finally {
      setCheckingImpact(false)
    }
  }

  async function requestDeleteGroup(target: {
    id: number
    title: string
    itemIds: number[]
    itemCount: number
  }) {
    setCheckingImpact(true)
    try {
      const budgets = await loadBudgetsSafe()
      const impacted = budgetsImpactedByCategories(budgets, target.itemIds)
      const labels = uniqueCategoryLabels(impacted)
      setGroupToDelete({
        id: target.id,
        title: target.title,
        message: buildGroupDeleteMessage(target.title, target.itemCount, labels),
      })
    } finally {
      setCheckingImpact(false)
    }
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Danh mục</Text>
            <Text style={styles.subtitle}>
              {categories.length}/{MAX_CATEGORY_GROUPS} nhóm
            </Text>
          </View>
          <TouchableOpacity style={styles.addGroupBtn} onPress={handleCreateGroup}>
            <Ionicons name="add" size={18} color={PASTEL_PALETTE.white} />
            <Text style={styles.addGroupText}>Tạo nhóm</Text>
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {categories.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Bắt đầu với danh mục của bạn</Text>
              {SETUP_STEPS.map((step) => (
                <View key={step.step} style={styles.stepCard}>
                  <View style={styles.stepIcon}>
                    <Ionicons name={step.icon} size={22} color={PASTEL_PALETTE.accentDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>
                      {step.step}. {step.title}
                    </Text>
                    <Text style={styles.stepDesc}>{step.description}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.emptyCta} onPress={handleCreateGroup}>
                <Text style={styles.emptyCtaText}>Tạo nhóm đầu tiên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            categories.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <View style={[styles.groupHeader, { backgroundColor: group.bgColor }]}>
                  <View style={styles.groupHeaderLeft}>
                    <Ionicons
                      name={group.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={group.color}
                    />
                    <Text style={[styles.groupTitle, { color: group.color }]}>{group.title}</Text>
                  </View>
                  <View style={styles.groupActions}>
                    <TouchableOpacity
                      style={[styles.groupActionBtn, { borderColor: group.color }]}
                      onPress={() => handleAddCategoryToGroup(group.id, group.items.length)}
                    >
                      <Ionicons name="add" size={16} color={group.color} />
                      <Text style={[styles.groupActionText, { color: group.color }]}>
                        Tạo danh mục
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.groupDeleteBtn}
                      disabled={checkingImpact}
                      onPress={() =>
                        requestDeleteGroup({
                          id: group.id,
                          title: group.title,
                          itemCount: group.items.length,
                          itemIds: group.items.map((i) => i.id),
                        })
                      }
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {group.items.length === 0 ? (
                  <Text style={styles.noItemText}>Chưa có danh mục trong nhóm này</Text>
                ) : (
                  group.items.map((item) => (
                    <CategoryItemRow
                      key={item.id}
                      item={item}
                      budgetSummary={getCategoryBudgetSummary(budgetMap, item.id)}
                      onRequestDelete={(target) => requestDeleteItem(target)}
                      onSetupBudget={handleSetupBudget}
                    />
                  ))
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <AddGroupModal
        visible={groupModalVisible}
        categories={categories}
        onClose={() => setGroupModalVisible(false)}
        onSubmit={addGroup}
      />

      <AddCategoryModal
        visible={itemModalVisible}
        categories={categories}
        defaultGroupId={defaultGroupId}
        onClose={() => {
          setItemModalVisible(false)
          setDefaultGroupId(undefined)
        }}
        onCreateGroup={addGroup}
        onSubmit={addItem}
      />

      <ConfirmModal
        visible={!!itemToDelete}
        title="Xóa danh mục"
        message={itemToDelete?.message ?? ''}
        isDestructive
        confirmText="Xóa"
        onConfirm={async () => {
          if (!itemToDelete) return
          try {
            setDeleting(true)
            await removeItem(itemToDelete.id)
            await loadBudgets()
            showToast({ variant: 'success', message: 'Đã xóa danh mục' })
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không xóa được danh mục')
          } finally {
            setDeleting(false)
            setItemToDelete(null)
          }
        }}
        onCancel={() => {
          if (!deleting) setItemToDelete(null)
        }}
      />

      <ConfirmModal
        visible={!!groupToDelete}
        title="Xóa nhóm"
        message={groupToDelete?.message ?? ''}
        isDestructive
        confirmText="Xóa"
        onConfirm={async () => {
          if (!groupToDelete) return
          try {
            setDeleting(true)
            await removeGroup(groupToDelete.id)
            await loadBudgets()
            showToast({ variant: 'success', message: 'Đã xóa nhóm danh mục' })
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không xóa được nhóm')
          } finally {
            setDeleting(false)
            setGroupToDelete(null)
          }
        }}
        onCancel={() => {
          if (!deleting) setGroupToDelete(null)
        }}
      />
    </View>
  )
}
