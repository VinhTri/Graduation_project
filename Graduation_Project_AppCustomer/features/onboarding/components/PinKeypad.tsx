import { Text, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'

type PinKeypadProps = {
  onPressKey: (key: string) => void
  leftAction?: {
    label: string
    onPress: () => void
    disabled?: boolean
  }
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

export default function PinKeypad({ onPressKey, leftAction }: PinKeypadProps) {
  return (
    <View style={styles.keypad}>
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.keypadKey}
              onPress={() => onPressKey(key)}
              activeOpacity={0.7}
            >
              <Text style={styles.keypadKeyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.keypadRow}>
        {leftAction ? (
          <TouchableOpacity
            style={styles.keypadSideKey}
            onPress={leftAction.onPress}
            disabled={leftAction.disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.keypadSideKeyText,
                leftAction.disabled && styles.keypadSideKeyTextDisabled,
              ]}
            >
              {leftAction.label}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.keypadSideKey} />
        )}

        <TouchableOpacity
          style={styles.keypadKey}
          onPress={() => onPressKey('0')}
          activeOpacity={0.7}
        >
          <Text style={styles.keypadKeyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.keypadKey}
          onPress={() => onPressKey('backspace')}
          activeOpacity={0.7}
        >
          <Feather name="delete" size={22} color={PASTEL_PALETTE.title} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
