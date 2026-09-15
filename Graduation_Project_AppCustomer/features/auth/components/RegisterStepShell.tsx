import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native'
import RegisterStepProgress from '@/features/auth/components/RegisterStepProgress'
import { authScreenStyles as formStyles } from '@/shared/styles/authScreen.styles'
import { registerScreenStyles as styles } from '@/features/auth/styles/registerScreen.styles'

type RegisterStepShellProps = {
  step?: 1 | 2 | 3
  children: React.ReactNode
  showStepProgress?: boolean
}

export default function RegisterStepShell({
  step = 1,
  children,
  showStepProgress = false,
}: RegisterStepShellProps) {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showStepProgress ? <RegisterStepProgress currentStep={step} /> : null}
          <View
            style={[
              formStyles.formContainer,
              styles.formFlex,
              !showStepProgress && styles.formWithoutStepper,
            ]}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
