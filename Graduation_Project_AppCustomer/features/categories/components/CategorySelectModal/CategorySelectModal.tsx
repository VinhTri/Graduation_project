import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBudgets } from '@/shared/services/budget.service'
import type { CategoryGroup, CategoryItem } from '@/shared/types/category'
import { MAX_ITEMS_PER_GROUP } from '../../constants/categoryLimits'
import {
  buildCategoryBudgetMap,
  getCategoryBudgetSummary,
  type CategoryBudgetSummary,
} from '../../utils/categoryBudgetStatus'

type Props = {
  visible: boolean
  categories: CategoryGroup[]
  onClose: () => void
  onSelect: (category: CategoryItem, groupName: string) => void
  onAddCategory?: () => void
}

export function CategorySelectModal({
  visible,
  categories,
  onClose,
  onSelect,
  onAddCategory,
}: Props) {
  const [budgetMap, setBudgetMap] = useState<Map<number, CategoryBudgetSummary>>(
    () => new Map(),
  )

  const groupsWithItems = useMemo(
    () => categories.filter((g) => (g.items?.length ?? 0) > 0),
    [categories],
  )

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    ;(async () => {
      try {
        const budgets = await getBudgets()
        if (!cancelled) {
          setBudgetMap(buildCategoryBudgetMap(budgets))
        }
      } catch {
        if (!cancelled) {
          setBudgetMap(new Map())
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn danh mục</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>

          {groupsWithItems.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="pricetags-outline" size={48} color={PASTEL_PALETTE.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có danh mục</Text>
              <Text style={styles.emptySubtitle}>
                Tạo nhóm và danh mục đầu tiên để phân loại giao dịch sổ tay tiền mặt.
              </Text>
              {onAddCategory ? (
                <TouchableOpacity style={styles.emptyCta} onPress={onAddCategory}>
                  <Ionicons name="add-circle-outline" size={20} color={PASTEL_PALETTE.white} />
                  <Text style={styles.emptyCtaText}>Tạo danh mục mới</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {onAddCategory ? (
                <TouchableOpacity style={styles.addRow} onPress={onAddCategory} activeOpacity={0.75}>
                  <Ionicons name="add-circle-outline" size={20} color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.addRowText}>Tạo danh mục mới</Text>
                </TouchableOpacity>
              ) : null}

              {groupsWithItems.map((group) => {
                const count = group.items?.length ?? 0
                const isFull = count >= MAX_ITEMS_PER_GROUP

                return (
                  <View key={group.id} style={styles.listGroup}>
                    <View style={styles.listGroupHeader}>
                      <View style={styles.listGroupTitleRow}>
                        <Ionicons
                          name={(group.icon as keyof typeof Ionicons.glyphMap) || 'folder'}
                          size={18}
                          color={group.color}
                        />
                        <Text style={[styles.listGroupTitle, { color: group.color }]}>
                          {group.title}
                        </Text>
                      </View>
                      <Text style={[styles.listGroupCount, isFull && styles.listGroupCountFull]}>
                        {count}/{MAX_ITEMS_PER_GROUP}
                      </Text>
                    </View>

                    {isFull ? (
                      <Text style={styles.listGroupFullHint}>
                        Danh mục đã đạt số lượng tối đa
                      </Text>
                    ) : null}

                    {group.items.map((item) => {
                      const summary = getCategoryBudgetSummary(budgetMap, item.id)
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.listItem}
                          onPress={() => onSelect(item, group.title)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[styles.listIconContainer, { backgroundColor: item.bgColor }]}
                          >
                            <Ionicons
                              name={item.icon as keyof typeof Ionicons.glyphMap}
                              size={22}
                              color={item.color}
                            />
                          </View>
                          <View style={styles.listItemText}>
                            <Text style={styles.listItemLabel} numberOfLines={1}>
                              {item.label}
                            </Text>
                            <View
                              style={[
                                styles.budgetBadge,
                                summary.hasBudget
                                  ? styles.budgetBadgeDone
                                  : styles.budgetBadgeTodo,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.budgetBadgeText,
                                  summary.hasBudget
                                    ? styles.budgetBadgeTextDone
                                    : styles.budgetBadgeTextTodo,
                                ]}
                                numberOfLines={1}
                              >
                                {summary.hasBudget
                                  ? 'Đã thiết lập ngân sách'
                                  : 'Chưa thiết lập ngân sách'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 28,
    maxHeight: '78%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_PALETTE.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  closeBtn: {
    padding: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCtaText: {
    color: PASTEL_PALETTE.white,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  listGroup: {
    marginBottom: 18,
  },
  listGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  listGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  listGroupTitle: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  listGroupCount: {
    fontSize: 13,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
  listGroupCountFull: {
    color: '#DC2626',
  },
  listGroupFullHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  listIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemText: {
    flex: 1,
    gap: 4,
  },
  listItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  budgetBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  budgetBadgeTodo: {
    backgroundColor: '#FEF3C7',
  },
  budgetBadgeDone: {
    backgroundColor: '#D1FAE5',
  },
  budgetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  budgetBadgeTextTodo: {
    color: '#D97706',
  },
  budgetBadgeTextDone: {
    color: '#059669',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderWidth: 1,
    borderColor: '#F9A8D4',
  },
  addRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
  },
})
