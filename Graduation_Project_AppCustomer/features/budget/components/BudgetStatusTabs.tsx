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
            style={styles.item}
            onPress={() => onChange(index)}
            activeOpacity={0.85}
          >
            <Text style={[styles.text, selected && styles.textActive]} numberOfLines={1}>
              {meta.tabLabel}
            </Text>
            {selected ? <View style={styles.underline} /> : null}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_PALETTE.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
  },
  textActive: {
    color: PASTEL_PALETTE.title,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: PASTEL_PALETTE.accentDeep,
  },
})
