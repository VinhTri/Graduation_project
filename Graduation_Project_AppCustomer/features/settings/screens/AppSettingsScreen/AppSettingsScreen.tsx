import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, useLanguage } from '../../../../shared/contexts/ThemeLanguageContext';
import { styles as sharedStyles } from '../../SettingsScreen.styles';

const ANIM_CONFIG = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

// ─── Theme sub-options (collapse) ────────────────────────────────────────────
function ThemeSubItems() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t } = useLanguage();

  const options: { mode: 'system' | 'light' | 'dark'; icon: string; label: string; sub: string }[] = [
    { mode: 'system', icon: 'phone-portrait-outline', label: t('themeSystem'), sub: t('themeSystemSub') },
    { mode: 'light',  icon: 'sunny-outline',          label: t('themeLight'),  sub: t('themeLightSub')  },
    { mode: 'dark',   icon: 'moon-outline',           label: t('themeDark'),   sub: t('themeDarkSub')   },
  ];

  return (
    <View style={[sharedStyles.securitySubList, { backgroundColor: theme.bgSoft, borderTopColor: theme.divider }]}>
      {options.map((opt, idx) => {
        const isSelected = themeMode === opt.mode;
        return (
          <TouchableOpacity
            key={opt.mode}
            style={[
              sharedStyles.securitySubItem,
              {
                borderBottomColor: theme.divider,
                borderBottomWidth: idx < options.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setThemeMode(opt.mode)}
          >
            <View
              style={[
                sharedStyles.securitySubIcon,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.card,
                  borderColor: isSelected ? theme.primary : theme.cardBorder,
                },
              ]}
            >
              <Ionicons
                name={opt.icon as any}
                size={16}
                color={isSelected ? theme.primary : theme.textSecondary}
              />
            </View>
            <View style={sharedStyles.itemContent}>
              <Text style={[sharedStyles.itemTitle, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                {opt.label}
              </Text>
              <Text style={[sharedStyles.itemSubtitle, { color: theme.textSecondary }]}>
                {opt.sub}
              </Text>
            </View>
            {isSelected && <Feather name="check" size={16} color={theme.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AppSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [expandedTheme, setExpandedTheme] = useState(false);
  const measuredHeight = useSharedValue(0);
  const progress = useSharedValue(0);

  const toggleThemeExpand = () => {
    const next = !expandedTheme;
    setExpandedTheme(next);
    progress.value = withTiming(next ? 1 : 0, ANIM_CONFIG);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  const handleDarkSwitch = (val: boolean) => {
    setThemeMode(val ? 'dark' : 'light');
  };

  const handleLangSwitch = (val: boolean) => {
    setLanguage(val ? 'en' : 'vi');
  };

  return (
    <View style={[sharedStyles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />

      {/* Header */}
      <View
        style={[
          localStyles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: theme.card,
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[localStyles.backBtn, { backgroundColor: theme.bgSoft }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[localStyles.headerTitle, { color: theme.textPrimary }]}>
          {t('appSettings')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          sharedStyles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section */}
        <View style={sharedStyles.section}>
          <View style={sharedStyles.sectionHeader}>
            <Text style={[sharedStyles.sectionTitle, { color: theme.textPrimary }]}>
              {t('appSettingsSubtitle')}
            </Text>
          </View>

          <View style={[sharedStyles.sectionBody, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* 1. Dark Mode Quick Switch Row */}
            <View
              style={[
                sharedStyles.itemContainer,
                { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider },
              ]}
            >
              <View style={[sharedStyles.itemIconContainer, { backgroundColor: isDark ? '#312E81' : theme.primarySoft }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color={theme.primary} />
              </View>
              <View style={sharedStyles.itemContent}>
                <Text style={[sharedStyles.itemTitle, { color: theme.textPrimary }]}>{t('darkMode')}</Text>
                <Text style={[sharedStyles.itemSubtitle, { color: theme.textSecondary }]}>
                  {isDark ? t('themeDark') : t('themeLight')}
                </Text>
              </View>

              {/* Quick Switch */}
              <Switch
                value={isDark}
                onValueChange={handleDarkSwitch}
                trackColor={{ false: '#CBD5E1', true: theme.primary }}
                thumbColor="#FFFFFF"
              />

              <TouchableOpacity onPress={toggleThemeExpand} style={{ marginLeft: 10, padding: 4 }}>
                <Animated.View style={chevronStyle}>
                  <Feather name="chevron-down" size={18} color={theme.textMuted} />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {expandedTheme && <ThemeSubItems />}

            {/* 2. Language Quick Switch Row */}
            <View style={sharedStyles.itemContainer}>
              <View style={[sharedStyles.itemIconContainer, { backgroundColor: isDark ? '#1E3A8A' : '#EDE9FE' }]}>
                <Text style={localStyles.flagText}>{language === 'en' ? '🇬🇧' : '🇻🇳'}</Text>
              </View>
              <View style={sharedStyles.itemContent}>
                <Text style={[sharedStyles.itemTitle, { color: theme.textPrimary }]}>{t('language')}</Text>
                <Text style={[sharedStyles.itemSubtitle, { color: theme.textSecondary }]}>
                  {language === 'en' ? 'English (🇬🇧)' : 'Tiếng Việt (🇻🇳)'}
                </Text>
              </View>

              {/* Quick Switch */}
              <Switch
                value={language === 'en'}
                onValueChange={handleLangSwitch}
                trackColor={{ false: '#EC4899', true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Info box */}
        <View
          style={[
            localStyles.infoBox,
            { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder },
          ]}
        >
          <Feather name="info" size={16} color={theme.primary} style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={[localStyles.infoText, { color: theme.textSecondary }]}>
            {t('appliedImmediately')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  infoBox: {
    flexDirection: 'row',
    marginTop: 14,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  flagText: {
    fontSize: 18,
  },
});
