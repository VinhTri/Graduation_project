import { StyleSheet, Text } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

type Props = {
  value: string
  maxLength: number
}

export function CharacterCounter({ value, maxLength }: Props) {
  const count = value.length
  const atLimit = count >= maxLength

  return (
    <Text
      style={[styles.counter, atLimit && styles.counterAtLimit]}
      accessibilityLabel={`${count} trên ${maxLength} ký tự`}
    >
      {count}/{maxLength}
    </Text>
  )
}

const styles = StyleSheet.create({
  counter: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginRight: 2,
    fontSize: 11,
    fontWeight: '600',
    color: PASTEL_PALETTE.gray400,
  },
  counterAtLimit: {
    color: PASTEL_PALETTE.error,
    fontWeight: '800',
  },
})
