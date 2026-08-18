import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native'
import AuthBrandHeader from '@/shared/components/AuthBrandHeader/AuthBrandHeader'
import RegisterStepProgress from '@/features/auth/components/RegisterStepProgress'
import { authScreenStyles as formStyles } from '@/shared/styles/authScreen.styles'
import { registerScreenStyles as styles } from '@/features/auth/styles/registerScreen.styles'

type RegisterStepShellProps = {
  step: 1 | 2 | 3
  subtitle: string
  children: React.ReactNode
}

export default function RegisterStepShell({
  step,
  subtitle,
  children,
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
          <AuthBrandHeader subtitle={subtitle} />
          <RegisterStepProgress currentStep={step} />
          <View style={[formStyles.formContainer, styles.formFlex]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
