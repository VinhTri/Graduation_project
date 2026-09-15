import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

type IconPickerProps = {
  icons: readonly string[]
  selectedIcon: string
  onSelect: (iconName: string) => void
  color?: string
  emptyText?: string
}

export function IconPicker({
  icons,
  selectedIcon,
  onSelect,
  color,
  emptyText = 'Không còn icon trống',
}: IconPickerProps) {
  const activeColor = color || PASTEL_PALETTE.accentDeep

  if (icons.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        <View style={styles.grid}>
          {icons.map((icon) => {
            const isSelected = selectedIcon === icon
            return (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconItem,
                  isSelected && { backgroundColor: activeColor, borderColor: activeColor },
                ]}
                onPress={() => onSelect(icon)}
              >
                <Ionicons
                  name={icon as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={isSelected ? PASTEL_PALETTE.white : PASTEL_PALETTE.textMuted}
                />
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    height: 120,
  },
  grid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 120,
    gap: 8,
    paddingHorizontal: 4,
  },
  iconItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  emptyWrap: {
    marginVertical: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
  },
})
