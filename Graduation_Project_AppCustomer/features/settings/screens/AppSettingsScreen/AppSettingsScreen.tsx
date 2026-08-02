import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ScrollView,
  StyleSheet,
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
    { mode: 'system', icon: 'phone-portrait-outline', label: t('themeSystem'),  sub: t('themeSystemSub')  },
    { mode: 'light',  icon: 'sunny-outline',          label: t('themeLight'),   sub: t('themeLightSub')   },
    { mode: 'dark',   icon: 'moon-outline',            label: t('themeDark'),    sub: t('themeDarkSub')    },
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

// ─── Language sub-options (collapse) ─────────────────────────────────────────
function LanguageSubItems() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  const options: { code: 'vi' | 'en'; flag: string; label: string; sub: string }[] = [
    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt', sub: 'Vietnamese' },
    { code: 'en', flag: '🇬🇧', label: 'English',    sub: 'Tiếng Anh'  },
  ];

  return (
    <View style={[sharedStyles.securitySubList, { backgroundColor: theme.bgSoft, borderTopColor: theme.divider }]}>
      {options.map((opt, idx) => {
        const isSelected = language === opt.code;
        return (
          <TouchableOpacity
            key={opt.code}
            style={[
              sharedStyles.securitySubItem,
              {
                borderBottomColor: theme.divider,
                borderBottomWidth: idx < options.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setLanguage(opt.code)}
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
              <Text style={localStyles.flagText}>{opt.flag}</Text>
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

// ─── Collapse row wrapper ─────────────────────────────────────────────────────
function CollapseRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  isLast,
  borderTopColor,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  isLast?: boolean;
  borderTopColor: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const progress = useSharedValue(0);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withTiming(next ? 1 : 0, ANIM_CONFIG);
  };

  const panelStyle = useAnimatedStyle(() => {
    const h = measuredHeight > 0 ? measuredHeight : 0;
    return {
      height: progress.value * h,
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.55, 1]),
      transform: [{ translateY: interpolate(progress.value, [0, 1], [-6, 0]) }],
    };
  });

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <>
      <Pressable
        style={[
          sharedStyles.itemContainer,
          {
            borderBottomWidth: expanded || !isLast ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: theme.divider,
          },
        ]}
        onPress={toggle}
      >
        <View style={[sharedStyles.itemIconContainer, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={sharedStyles.itemContent}>
          <Text style={[sharedStyles.itemTitle, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[sharedStyles.itemSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={18} color={theme.textMuted} />
        </Animated.View>
      </Pressable>

      {/* Hidden measure ghost */}
      <View
        style={sharedStyles.securityMeasure}
        pointerEvents="none"
        onLayout={(e) => {
          const next = Math.ceil(e.nativeEvent.layout.height);
          if (next > 0 && next !== measuredHeight) setMeasuredHeight(next);
        }}
      >
        {children}
      </View>

      {/* Animated collapse */}
      <Animated.View style={[sharedStyles.securityCollapse, panelStyle]}>
        {children}
      </Animated.View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
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

  const getLanguageLabel = () => (language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧');

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
            {/* Dark Mode row */}
            <CollapseRow
              iconBg={isDark ? '#312E81' : theme.primarySoft}
              icon={<Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color={theme.primary} />}
              title={t('darkMode')}
              subtitle={getThemeLabel()}
              isLast={false}
              borderTopColor={theme.divider}
            >
              <ThemeSubItems />
            </CollapseRow>

            {/* Language row */}
            <CollapseRow
              iconBg={isDark ? '#1E3A8A' : '#EDE9FE'}
              icon={<Ionicons name="globe-outline" size={19} color={isDark ? '#818CF8' : '#7C3AED'} />}
              title={t('language')}
              subtitle={getLanguageLabel()}
              isLast
              borderTopColor={theme.divider}
            >
              <LanguageSubItems />
            </CollapseRow>
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
