import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { BudgetApplyTo } from '@/shared/types/budget'
import { BUDGET_APPLY_OPTIONS } from '../constants/applyTo'

type Props = {
  value: BudgetApplyTo
  onChange: (value: BudgetApplyTo) => void
}

const APPLY_ICONS: Record<BudgetApplyTo, keyof typeof Ionicons.glyphMap> = {
  NOTEBOOK: 'book-outline',
  WALLET: 'wallet-outline',
  BOTH: 'git-compare-outline',
}

export function ApplyToPicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {BUDGET_APPLY_OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.item, selected && styles.itemSelected]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.85}
          >
            <View
              style={[styles.iconWrap, selected && styles.iconWrapSelected]}
            >
              <Ionicons
                name={APPLY_ICONS[option.value]}
                size={18}
                color={selected ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.lavender}
              />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {option.label}
              </Text>
              <Text style={[styles.hint, selected && styles.hintSelected]}>
                {option.hint}
              </Text>
            </View>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={selected ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.gray200}
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    backgroundColor: PASTEL_PALETTE.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  itemSelected: {
    borderColor: PASTEL_PALETTE.accentDeep,
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
  },
  iconWrapSelected: {
    backgroundColor: PASTEL_PALETTE.white,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: PASTEL_PALETTE.textDark,
  },
  labelSelected: {
    color: PASTEL_PALETTE.title,
  },
  hint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: PASTEL_PALETTE.textMuted,
  },
  hintSelected: {
    color: PASTEL_PALETTE.subtitle,
  },
})
