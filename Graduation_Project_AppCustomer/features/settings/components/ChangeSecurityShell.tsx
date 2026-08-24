import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { changeSecurityStyles as styles } from '../styles/changeSecurity.styles'

type ChangeSecurityShellProps = {
  title: string
  subtitle: string
  stepLabel?: string
  onBack?: () => void
  children: React.ReactNode
}

export default function ChangeSecurityShell({
  title,
  subtitle,
  stepLabel,
  onBack,
  children,
}: ChangeSecurityShellProps) {
  const router = useRouter()

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
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack ?? (() => router.back())}
              activeOpacity={0.75}
            >
              <Feather name="chevron-left" size={22} color={PASTEL_PALETTE.accentDeep} />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
          </View>

          {stepLabel ? (
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{stepLabel}</Text>
            </View>
          ) : null}

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
