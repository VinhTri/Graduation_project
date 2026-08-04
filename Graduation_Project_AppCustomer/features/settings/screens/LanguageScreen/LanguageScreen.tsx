import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useLanguage, Language } from '../../../../shared/contexts/ThemeLanguageContext';

export function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages: { id: Language; name: string; flag: string; nativeName: string }[] = [
    {
      id: 'vi',
      name: 'Tiếng Việt',
      flag: '🇻🇳',
      nativeName: 'Vietnamese',
    },
    {
      id: 'en',
      name: 'English',
      flag: '🇬🇧',
      nativeName: 'English (US/UK)',
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('language')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Switch Card */}
        <View style={[styles.quickSwitchCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={styles.flagEmoji}>{language === 'en' ? '🇬🇧' : '🇻🇳'}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.langName, { color: theme.textPrimary }]}>
              {language === 'en' ? 'English (🇬🇧)' : 'Tiếng Việt (🇻🇳)'}
            </Text>
            <Text style={[styles.langNative, { color: theme.textSecondary }]}>
              {t('languageSubtitle')}
            </Text>
          </View>
          <Switch
            value={language === 'en'}
            onValueChange={(val) => setLanguage(val ? 'en' : 'vi')}
            trackColor={{ false: '#EC4899', true: '#7C3AED' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginTop: 16 }]}>
          Danh sách ngôn ngữ:
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {languages.map((item, index) => {
            const isSelected = language === item.id;
            const isLast = index === languages.length - 1;

            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.languageRow}
                  onPress={() => setLanguage(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagEmoji}>{item.flag}</Text>
                  <View style={styles.textContainer}>
                    <Text style={[styles.langName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.langNative, { color: theme.textSecondary }]}>
                      {item.nativeName}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {!isLast && <View style={[styles.divider, { backgroundColor: theme.divider }]} />}
              </React.Fragment>
            );
          })}
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  flagEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  langNative: {
    fontSize: 13,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});
