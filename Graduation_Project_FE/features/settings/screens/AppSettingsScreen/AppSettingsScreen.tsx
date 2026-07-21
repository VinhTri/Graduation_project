import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useLanguage } from '../../../../shared/contexts/ThemeLanguageContext';

export function AppSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, themeMode } = useTheme();
  const { language, t } = useLanguage();

  const getThemeLabel = () => {
    if (themeMode === 'system') return t('themeSystem');
    if (themeMode === 'dark') return t('themeDark');
    return t('themeLight');
  };

  const getLanguageLabel = () => {
    return language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧';
  };

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('appSettings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          {t('appSettingsSubtitle')}
        </Text>

        {/* Section: Customization */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Dark Mode item */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/settings/dark-mode' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#312E81' : '#FCE7F3' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={theme.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{t('darkMode')}</Text>
              <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                {getThemeLabel()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Language item */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/settings/language' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E3A8A' : '#EDE9FE' }]}>
              <Ionicons name="globe-outline" size={20} color={isDark ? '#818CF8' : '#7C3AED'} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{t('language')}</Text>
              <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                {getLanguageLabel()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={[styles.infoBox, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]}>
          <Feather name="info" size={18} color={theme.primary} style={{ marginRight: 10, marginTop: 2 }} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {t('appliedImmediately')}
          </Text>
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
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
