import { useRef, useState } from 'react'
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { CategoryItem } from '@/shared/types/category'
import type { CategoryBudgetSummary } from '../../utils/categoryBudgetStatus'
import { styles } from './CategoryItemRow.styles'

type Props = {
  item: CategoryItem
  budgetSummary: CategoryBudgetSummary
  onRequestDelete: (item: CategoryItem) => void
  onSetupBudget: (item: CategoryItem) => void
}

const BUDGET_ACTION_WIDTH = 128
const DELETE_WIDTH = 64
const PANEL_WIDTH = BUDGET_ACTION_WIDTH + DELETE_WIDTH

export function CategoryItemRow({
  item,
  budgetSummary,
  onRequestDelete,
  onSetupBudget,
}: Props) {
  const [open, setOpen] = useState(false)
  const progress = useRef(new Animated.Value(0)).current

  const toggle = () => {
    const next = !open
    setOpen(next)
    Animated.timing(progress, {
      toValue: next ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }

  const closePanel = () => {
    setOpen(false)
    progress.setValue(0)
  }

  const panelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PANEL_WIDTH],
  })

  const arrowRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const budgetActionLabel = budgetSummary.hasBudget
    ? 'Thêm thiết lập ngân sách'
    : 'Thiết lập ngân sách'

  return (
    <View style={styles.wrap}>
      <View style={styles.itemRow}>
        <View style={[styles.itemIcon, { backgroundColor: item.bgColor }]}>
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={item.color}
          />
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemLabel} numberOfLines={1}>
            {item.label}
          </Text>

          <View
            style={[
              styles.statusBadge,
              budgetSummary.hasBudget ? styles.statusBadgeDone : styles.statusBadgeTodo,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                budgetSummary.hasBudget
                  ? styles.statusBadgeTextDone
                  : styles.statusBadgeTextTodo,
              ]}
              numberOfLines={1}
            >
              {budgetSummary.hasBudget
                ? 'Đã thiết lập ngân sách'
                : 'Chưa thiết lập ngân sách'}
            </Text>
          </View>

          {budgetSummary.activeCount > 0 ? (
            <Text style={styles.activeHint} numberOfLines={1}>
              Đang có {budgetSummary.activeCount} ngân sách đang áp dụng
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={toggle}
          activeOpacity={0.75}
          hitSlop={8}
        >
          <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
            <Ionicons name="chevron-back" size={18} color={PASTEL_PALETTE.gray400} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.actionPanel, { width: panelWidth }]}>
        <TouchableOpacity
          style={[styles.budgetAction, { width: BUDGET_ACTION_WIDTH }]}
          activeOpacity={0.85}
          onPress={() => {
            if (!open) return
            closePanel()
            onSetupBudget(item)
          }}
        >
          <Text style={styles.budgetActionText} numberOfLines={2}>
            {budgetActionLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteAction, { width: DELETE_WIDTH }]}
          activeOpacity={0.85}
          onPress={() => {
            if (!open) return
            closePanel()
            onRequestDelete(item)
          }}
        >
          <Text style={styles.deleteActionText} numberOfLines={1}>
            Xóa
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}
