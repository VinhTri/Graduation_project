import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { BudgetStatus } from '@/shared/types/budget'
import { BUDGET_STATUS_META, BUDGET_STATUS_TABS } from '../constants/status'

type Props = {
  activeIndex: number
  onChange: (index: number) => void
}

export function BudgetStatusTabs({ activeIndex, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {BUDGET_STATUS_TABS.map((status: BudgetStatus, index) => {
        const selected = activeIndex === index
        const meta = BUDGET_STATUS_META[status]
        return (
          <TouchableOpacity
            key={status}
            style={[styles.item, selected && styles.itemActive]}
            onPress={() => onChange(index)}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, selected && styles.textActive]} numberOfLines={1}>
              {meta.tabLabel}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 4,
    borderRadius: 15,
    backgroundColor: '#EEE7EF',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 11,
  },
  itemActive: {
    backgroundColor: PASTEL_PALETTE.white,
    shadowColor: '#6D4AAF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
  },
  textActive: {
    color: '#6D4AAF',
    fontWeight: '900',
  },
})
