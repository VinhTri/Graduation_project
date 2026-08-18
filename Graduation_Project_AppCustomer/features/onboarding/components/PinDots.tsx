import { View } from 'react-native'
import { onboardingStyles as styles } from '@/features/onboarding/styles/onboarding.styles'

type PinDotsProps = {
  length: number
  filled: number
}

export default function PinDots({ length, filled }: PinDotsProps) {
  return (
    <View style={styles.pinCellsRow}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = index < filled
        return (
          <View
            key={index}
            style={[styles.pinCell, isFilled && styles.pinCellFilled]}
          >
            {isFilled ? <View style={styles.pinCellMark} /> : null}
          </View>
        )
      })}
    </View>
  )
}
