import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { useMoneyFormat } from '@/shared/contexts/MoneyFormatContext'
import type { CurrencySuffix, ThousandSeparator } from '@/shared/utils/moneyFormat'
import { formatMoney } from '@/shared/utils/moneyFormat'
import { styles } from './AppSettingsScreen.styles'

const SAMPLE = 100000

type OptionCardProps = {
  selected: boolean
  title: string
  example: string
  onPress: () => void
}

function OptionCard({ selected, title, example, onPress }: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionExample}>{example}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={20} color={PASTEL_PALETTE.accentDeep} />
      ) : (
        <View style={styles.checkSpacer} />
      )}
    </TouchableOpacity>
  )
}

export default function AppSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { prefs, setSuffix, setSeparator } = useMoneyFormat()

  const preview = formatMoney(SAMPLE, prefs)

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cài đặt ứng dụng</Text>
        </View>
      </PastelHeaderShell>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Ký hiệu tiền tệ</Text>
        <View style={styles.card}>
          <OptionCard
            selected={prefs.suffix === 'dong'}
            title="đ"
            example={formatMoney(SAMPLE, { ...prefs, suffix: 'dong' })}
            onPress={() => setSuffix('dong' as CurrencySuffix)}
          />
          <View style={styles.optionDivider} />
          <OptionCard
            selected={prefs.suffix === 'vnd'}
            title="VND"
            example={formatMoney(SAMPLE, { ...prefs, suffix: 'vnd' })}
            onPress={() => setSuffix('vnd' as CurrencySuffix)}
          />
        </View>

        <Text style={styles.sectionTitle}>Cách viết số</Text>
        <View style={styles.card}>
          <OptionCard
            selected={prefs.separator === 'dot'}
            title="Dấu chấm"
            example={formatMoney(SAMPLE, { ...prefs, separator: 'dot' })}
            onPress={() => setSeparator('dot' as ThousandSeparator)}
          />
          <View style={styles.optionDivider} />
          <OptionCard
            selected={prefs.separator === 'comma'}
            title="Dấu phẩy"
            example={formatMoney(SAMPLE, { ...prefs, separator: 'comma' })}
            onPress={() => setSeparator('comma' as ThousandSeparator)}
          />
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Xem trước</Text>
          <Text style={styles.previewValue}>{preview}</Text>
        </View>
      </ScrollView>
    </View>
  )
}
