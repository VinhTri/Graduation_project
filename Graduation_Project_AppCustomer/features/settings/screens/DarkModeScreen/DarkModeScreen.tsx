import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useLanguage, ThemeMode } from '../../../../shared/contexts/ThemeLanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

export function DarkModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { t } = useLanguage();

  const options: { id: ThemeMode; titleKey: 'themeSystem' | 'themeLight' | 'themeDark'; subKey: 'themeSystemSub' | 'themeLightSub' | 'themeDarkSub'; icon: string }[] = [
    {
      id: 'system',
      titleKey: 'themeSystem',
      subKey: 'themeSystemSub',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'light',
      titleKey: 'themeLight',
      subKey: 'themeLightSub',
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      titleKey: 'themeDark',
      subKey: 'themeDarkSub',
      icon: 'moon-outline',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.bgSoft }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('darkMode')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Switch Card */}
        <View style={[styles.quickSwitchCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={theme.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
              {isDark ? t('themeDark') : t('themeLight')}
            </Text>
            <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
              {t('themeSubtitle')}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
            trackColor={{ false: '#CBD5E1', true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginTop: 16 }]}>
          Tùy chọn chế độ giao diện:
        </Text>

        {/* Theme Options */}
        <View style={styles.optionsContainer}>
          {options.map((item) => {
            const isSelected = themeMode === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setThemeMode(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: isSelected ? theme.primarySoft : theme.bgSoft }]}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isSelected ? theme.primary : theme.textSecondary}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                    {t(item.titleKey)}
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
                    {t(item.subKey)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected ? theme.primary : theme.textMuted,
                      backgroundColor: isSelected ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live Preview Card */}
        <Text style={[styles.previewSectionTitle, { color: theme.textPrimary }]}>
          {t('preview')}
        </Text>

        <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <LinearGradient
            colors={theme.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewHeader}
          >
            <View style={styles.previewHeaderRow}>
              <View style={styles.previewAvatar} />
              <View>
                <Text style={styles.previewHeaderName}>SmartSpend Preview</Text>
                <Text style={styles.previewHeaderStatus}>{isDark ? 'Dark Theme Active' : 'Light Theme Active'}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.previewContent}>
            <View style={[styles.previewWalletCard, { backgroundColor: theme.bgSoft }]}>
              <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Số dư khả dụng</Text>
              <Text style={[styles.previewAmount, { color: theme.primary }]}>15.250.000 đ</Text>
            </View>

            <Text style={[styles.previewBodyText, { color: theme.textSecondary }]}>
              {t('previewText')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  quickSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  optionSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewHeader: {
    padding: 16,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: 12,
  },
  previewHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  previewHeaderStatus: {
    fontSize: 12,
    color: '#4B5563',
  },
  previewContent: {
    padding: 16,
  },
  previewWalletCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  previewAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  previewBodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
