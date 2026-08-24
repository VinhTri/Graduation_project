import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { useLanguage, useTheme, type ThemeMode } from '@/shared/contexts/ThemeLanguageContext'
import { useMoneyFormat } from '@/shared/contexts/MoneyFormatContext'
import { DEFAULT_MONEY_FORMAT, formatAmount, formatMoney, type CurrencySuffix, type ThousandSeparator } from '@/shared/utils/moneyFormat'
import type { Language } from '@/shared/i18n'
import { styles } from '../SettingsScreen.styles'

const ANIM_CONFIG = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
}

const ICON = PASTEL_PALETTE.accentDeep
const SAMPLE = 100000

function suffixLabel(suffix: CurrencySuffix) {
  return suffix === 'vnd' ? 'VND' : 'đ'
}

function separatorLabel(separator: ThousandSeparator) {
  return formatAmount(SAMPLE, { suffix: 'dong', separator })
}

function separatorShort(separator: ThousandSeparator) {
  return separator === 'comma' ? ',' : '.'
}

function CollapsibleBlock({ expanded, children }: { expanded: boolean; children: ReactNode }) {
  const [measuredHeight, setMeasuredHeight] = useState(0)
  const progress = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, ANIM_CONFIG)
  }, [expanded, progress])

  const panelStyle = useAnimatedStyle(() => {
    const h = measuredHeight > 0 ? measuredHeight : 0
    return {
      height: progress.value * h,
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.55, 1]),
      transform: [{ translateY: interpolate(progress.value, [0, 1], [-6, 0]) }],
    }
  })

  return (
    <>
      <View
        style={styles.securityMeasure}
        pointerEvents="none"
        onLayout={(e) => {
          const next = Math.ceil(e.nativeEvent.layout.height)
          if (next > 0 && next !== measuredHeight) setMeasuredHeight(next)
        }}
      >
        {children}
      </View>
      <Animated.View
        style={[styles.securityCollapse, panelStyle]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        {children}
      </Animated.View>
    </>
  )
}

function DefaultBadge() {
  return (
    <View style={styles.appSettingDefaultBadge}>
      <Text style={styles.appSettingDefaultBadgeText}>Mặc định</Text>
    </View>
  )
}

function SettingRow({
  icon,
  title,
  value,
  expanded,
  isLast,
  onPress,
}: {
  icon: ReactNode
  title: string
  value: string
  expanded: boolean
  isLast?: boolean
  onPress: () => void
}) {
  const chevron = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    chevron.value = withTiming(expanded ? 1 : 0, ANIM_CONFIG)
  }, [chevron, expanded])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevron.value, [0, 1], [0, 180])}deg` }],
  }))

  return (
    <TouchableOpacity
      style={[styles.securitySubItem, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.securitySubIcon}>{icon}</View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <Text style={styles.itemValue}>{value}</Text>
      <Animated.View style={chevronStyle}>
        <Feather name="chevron-down" size={16} color={PASTEL_PALETTE.lavender} />
      </Animated.View>
    </TouchableOpacity>
  )
}

function OptionRow({
  label,
  example,
  selected,
  systemDefault,
  isLast,
  onPress,
}: {
  label: string
  example: string
  selected: boolean
  systemDefault: boolean
  isLast?: boolean
  onPress?: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.appSettingSwitchRow, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={selected ? 1 : 0.75}
      disabled={selected}
      onPress={onPress}
    >
      <View style={[styles.appSettingSwitchIcon, selected && styles.appSettingSwitchIconActive]}>
        <Ionicons
          name={selected ? 'checkmark' : 'swap-horizontal'}
          size={16}
          color={ICON}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{label}</Text>
        <Text style={styles.itemSubtitle}>{example}</Text>
      </View>
      <View style={styles.appSettingValueWrap}>
        {selected && !systemDefault ? (
          <Text style={styles.appSettingSwitchHint}>Đang dùng</Text>
        ) : null}
        {systemDefault ? <DefaultBadge /> : null}
        {!selected ? <Text style={styles.appSettingSwitchHint}>Đổi sang</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

export function AppSettingsSection() {
  const { showToast } = useToast()
  const { prefs, setSuffix, setSeparator } = useMoneyFormat()
  const { themeMode, setThemeMode } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [numberOpen, setNumberOpen] = useState(false)

  const nextSuffix: CurrencySuffix = prefs.suffix === 'dong' ? 'vnd' : 'dong'
  const nextSeparator: ThousandSeparator = prefs.separator === 'dot' ? 'comma' : 'dot'
  const currentSuffix = suffixLabel(prefs.suffix)
  const currentSeparator = separatorLabel(prefs.separator)
  const nextLanguage: Language = language === 'vi' ? 'en' : 'vi'

  const themeOptions: { id: ThemeMode; label: string; example: string }[] = [
    { id: 'light', label: t('themeLight'), example: t('themeLightSub') },
    { id: 'dark', label: t('themeDark'), example: t('themeDarkSub') },
    { id: 'system', label: t('themeSystem'), example: t('themeSystemSub') },
  ]
  const selectedTheme = themeOptions.find((item) => item.id === themeMode) ?? themeOptions[0]
  const otherThemes = themeOptions.filter((item) => item.id !== selectedTheme.id)
  const currentThemeLabel = selectedTheme.label
  const currentLanguageLabel = language === 'en' ? t('english') : t('vietnamese')

  const toggleRoot = () => {
    const next = !expanded
    setExpanded(next)
    if (!next) {
      setThemeOpen(false)
      setLanguageOpen(false)
      setCurrencyOpen(false)
      setNumberOpen(false)
    }
  }

  const switchTheme = (mode: ThemeMode) => {
    const from = currentThemeLabel
    const to = themeOptions.find((item) => item.id === mode)?.label ?? mode
    void setThemeMode(mode)
    showToast({
      variant: 'success',
      message: `Đổi từ ${from} sang ${to} thành công`,
    })
  }

  const switchLanguage = () => {
    const from = currentLanguageLabel
    const to = nextLanguage === 'en' ? t('english') : t('vietnamese')
    void setLanguage(nextLanguage)
    showToast({
      variant: 'success',
      message: `Đổi từ ${from} sang ${to} thành công`,
    })
  }

  const switchSuffix = () => {
    const from = currentSuffix
    const to = suffixLabel(nextSuffix)
    setSuffix(nextSuffix)
    showToast({
      variant: 'success',
      message: `Đổi từ ${from} sang ${to} thành công`,
    })
  }

  const switchSeparator = () => {
    const from = currentSeparator
    const to = separatorLabel(nextSeparator)
    setSeparator(nextSeparator)
    showToast({
      variant: 'success',
      message: `Đổi từ ${from} sang ${to} thành công`,
    })
  }

  return (
    <>
      <Pressable
        style={[
          styles.itemContainer,
          { borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0 },
        ]}
        onPress={toggleRoot}
        android_ripple={{ color: PASTEL_PALETTE.accentSoft }}
      >
        <View style={styles.itemIconContainer}>
          <Ionicons name="settings-outline" size={20} color={ICON} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{t('appSettings')}</Text>
          <Text style={styles.itemSubtitle}>{t('appSettingsSubtitle')}</Text>
        </View>
        <RootChevron expanded={expanded} />
      </Pressable>

      <CollapsibleBlock expanded={expanded}>
        <View style={styles.securitySubList}>
          <SettingRow
            icon={<Ionicons name="moon-outline" size={16} color={ICON} />}
            title={t('darkMode')}
            value={currentThemeLabel}
            expanded={themeOpen}
            onPress={() => setThemeOpen((open) => !open)}
          />
          <CollapsibleBlock expanded={themeOpen}>
            <View style={styles.appSettingSwitchList}>
              <OptionRow
                label={selectedTheme.label}
                example={selectedTheme.example}
                selected
                systemDefault={selectedTheme.id === 'light'}
              />
              {otherThemes.map((item, index) => (
                <OptionRow
                  key={item.id}
                  label={item.label}
                  example={item.example}
                  selected={false}
                  systemDefault={item.id === 'light'}
                  isLast={index === otherThemes.length - 1}
                  onPress={() => switchTheme(item.id)}
                />
              ))}
            </View>
          </CollapsibleBlock>

          <SettingRow
            icon={<Ionicons name="language-outline" size={16} color={ICON} />}
            title={t('language')}
            value={currentLanguageLabel}
            expanded={languageOpen}
            onPress={() => setLanguageOpen((open) => !open)}
          />
          <CollapsibleBlock expanded={languageOpen}>
            <View style={styles.appSettingSwitchList}>
              <OptionRow
                label={currentLanguageLabel}
                example={language === 'en' ? 'English (US/UK)' : 'Vietnamese'}
                selected
                systemDefault={language === 'vi'}
              />
              <OptionRow
                label={nextLanguage === 'en' ? t('english') : t('vietnamese')}
                example={nextLanguage === 'en' ? 'English (US/UK)' : 'Vietnamese'}
                selected={false}
                systemDefault={nextLanguage === 'vi'}
                isLast
                onPress={switchLanguage}
              />
            </View>
          </CollapsibleBlock>

          <SettingRow
            icon={<Ionicons name="cash-outline" size={16} color={ICON} />}
            title="Ký hiệu tiền tệ"
            value={currentSuffix}
            expanded={currencyOpen}
            onPress={() => setCurrencyOpen((open) => !open)}
          />
          <CollapsibleBlock expanded={currencyOpen}>
            <View style={styles.appSettingSwitchList}>
              <OptionRow
                label={currentSuffix}
                example={formatMoney(SAMPLE, prefs)}
                selected
                systemDefault={prefs.suffix === DEFAULT_MONEY_FORMAT.suffix}
              />
              <OptionRow
                label={suffixLabel(nextSuffix)}
                example={formatMoney(SAMPLE, { ...prefs, suffix: nextSuffix })}
                selected={false}
                systemDefault={nextSuffix === DEFAULT_MONEY_FORMAT.suffix}
                isLast
                onPress={switchSuffix}
              />
            </View>
          </CollapsibleBlock>

          <SettingRow
            icon={<Ionicons name="text-outline" size={16} color={ICON} />}
            title="Cách viết số"
            value={currentSeparator}
            expanded={numberOpen}
            isLast={!numberOpen}
            onPress={() => setNumberOpen((open) => !open)}
          />
          <CollapsibleBlock expanded={numberOpen}>
            <View style={[styles.appSettingSwitchList, { borderBottomWidth: 0 }]}>
              <OptionRow
                label={separatorShort(prefs.separator)}
                example={formatMoney(SAMPLE, prefs)}
                selected
                systemDefault={prefs.separator === DEFAULT_MONEY_FORMAT.separator}
              />
              <OptionRow
                label={separatorShort(nextSeparator)}
                example={formatMoney(SAMPLE, { ...prefs, separator: nextSeparator })}
                selected={false}
                systemDefault={nextSeparator === DEFAULT_MONEY_FORMAT.separator}
                isLast
                onPress={switchSeparator}
              />
            </View>
          </CollapsibleBlock>
        </View>
      </CollapsibleBlock>
    </>
  )
}

function RootChevron({ expanded }: { expanded: boolean }) {
  const progress = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, ANIM_CONFIG)
  }, [expanded, progress])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }))

  return (
    <Animated.View style={chevronStyle}>
      <Feather name="chevron-down" size={18} color={PASTEL_PALETTE.lavender} />
    </Animated.View>
  )
}
