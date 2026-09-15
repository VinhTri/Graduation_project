import { Text, View, StyleSheet } from 'react-native'
import { Feather, FontAwesome5 } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getPasswordRuleResults } from '@/features/auth/constants/registerValidation'

type PasswordRequirementListProps = {
  password: string
}

export default function PasswordRequirementList({ password }: PasswordRequirementListProps) {
  const rules = getPasswordRuleResults(password)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome5 name="lightbulb" size={15} color={PASTEL_PALETTE.lavender} solid />
        <Text style={styles.headerText}>Mật khẩu phải bao gồm:</Text>
      </View>

      {rules.map((rule) => {
        const passed = password.length > 0 && rule.passed

        return (
          <View key={rule.id} style={styles.ruleRow}>
            <View style={[styles.iconWrap, passed ? styles.iconWrapPassed : styles.iconWrapFailed]}>
              <Feather
                name={passed ? 'check' : 'x'}
                size={12}
                color={passed ? '#FFFFFF' : '#EF4444'}
              />
            </View>
            <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>{rule.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconWrapFailed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  iconWrapPassed: {
    backgroundColor: '#10B981',
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: PASTEL_PALETTE.textMuted,
  },
  ruleTextPassed: {
    color: '#059669',
    fontWeight: '600',
  },
})
