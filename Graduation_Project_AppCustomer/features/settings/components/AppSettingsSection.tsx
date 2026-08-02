import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, useLanguage } from '../../../shared/contexts/ThemeLanguageContext';
import { styles } from '../SettingsScreen.styles';

const ANIM_CONFIG = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

// ─── Sub-options rendered inside the collapse panel ──────────────────────────
const AppSettingsSubItems = () => {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const themeOptions: { mode: 'system' | 'light' | 'dark'; icon: string; label: string }[] = [
    { mode: 'system', icon: 'phone-portrait-outline', label: t('themeSystem') },
    { mode: 'light',  icon: 'sunny-outline',          label: t('themeLight')  },
    { mode: 'dark',   icon: 'moon-outline',            label: t('themeDark')   },
  ];

  const langOptions: { code: 'vi' | 'en'; flag: string; label: string }[] = [
    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
    { code: 'en', flag: '🇬🇧', label: 'English'    },
  ];

  return (
    <View style={[styles.securitySubList, { backgroundColor: theme.bgSoft, borderTopColor: theme.divider }]}>

      {/* ── Theme label ── */}
      <View style={[localStyles.groupLabel, { borderBottomColor: theme.divider }]}>
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
        <Text style={[localStyles.groupLabelText, { color: theme.textMuted }]}>{t('darkMode')}</Text>
      </View>

      {/* ── Theme options ── */}
      {themeOptions.map((opt, idx) => {
        const isSelected = themeMode === opt.mode;
        const isLast = idx === themeOptions.length - 1;
        return (
          <TouchableOpacity
            key={opt.mode}
            style={[
              styles.securitySubItem,
              {
                borderBottomColor: theme.divider,
                borderBottomWidth: isLast ? StyleSheet.hairlineWidth : StyleSheet.hairlineWidth,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setThemeMode(opt.mode)}
          >
            <View
              style={[
                styles.securitySubIcon,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.card,
                  borderColor: isSelected ? theme.primary : theme.cardBorder,
                },
              ]}
            >
              <Ionicons
                name={opt.icon as any}
                size={15}
                color={isSelected ? theme.primary : theme.textSecondary}
              />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                {opt.label}
              </Text>
            </View>
            {isSelected && <Feather name="check" size={15} color={theme.primary} />}
          </TouchableOpacity>
        );
      })}

      {/* ── Language label ── */}
      <View style={[localStyles.groupLabel, { borderBottomColor: theme.divider, borderTopColor: theme.divider, borderTopWidth: StyleSheet.hairlineWidth }]}>
        <Ionicons name="globe-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
        <Text style={[localStyles.groupLabelText, { color: theme.textMuted }]}>{t('language')}</Text>
      </View>

      {/* ── Language options ── */}
      {langOptions.map((opt, idx) => {
        const isSelected = language === opt.code;
        const isLast = idx === langOptions.length - 1;
        return (
          <TouchableOpacity
            key={opt.code}
            style={[
              styles.securitySubItem,
              {
                borderBottomColor: theme.divider,
                borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setLanguage(opt.code)}
          >
            <View
              style={[
                styles.securitySubIcon,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.card,
                  borderColor: isSelected ? theme.primary : theme.cardBorder,
                },
              ]}
            >
              <Text style={localStyles.flagText}>{opt.flag}</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                {opt.label}
              </Text>
            </View>
            {isSelected && <Feather name="check" size={15} color={theme.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Main exported section (mirrors SecuritySection structure exactly) ─────────
export const AppSettingsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const { theme, isDark, themeMode } = useTheme();
  const { language, t } = useLanguage();

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

  // Subtitle shows current theme + language
  const getSubtitle = () => {
    const themePart =
      themeMode === 'system' ? t('themeSystem')
      : themeMode === 'dark'   ? t('themeDark')
      : t('themeLight');
    const langPart = language === 'vi' ? 'Tiếng Việt' : 'English';
    return `${themePart} · ${langPart}`;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {t('supportAndSettings')}
        </Text>
      </View>

      <View style={[styles.sectionBody, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* ── Header row (tap to expand) ── */}
        <Pressable
          style={[
            styles.itemContainer,
            {
              borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: theme.divider,
            },
          ]}
          onPress={toggle}
        >
          <View style={[styles.itemIconContainer, { backgroundColor: isDark ? '#1E293B' : theme.primarySoft }]}>
            <Ionicons name="settings-outline" size={19} color={theme.primary} />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{t('appSettings')}</Text>
            <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {getSubtitle()}
            </Text>
          </View>
          <Animated.View style={chevronStyle}>
            <Feather name="chevron-down" size={18} color={theme.textMuted} />
          </Animated.View>
        </Pressable>

        {/* Hidden ghost for height measurement */}
        <View
          style={styles.securityMeasure}
          pointerEvents="none"
          onLayout={(e) => {
            const next = Math.ceil(e.nativeEvent.layout.height);
            if (next > 0 && next !== measuredHeight) {
              setMeasuredHeight(next);
            }
          }}
        >
          <AppSettingsSubItems />
        </View>

        {/* Animated collapse panel */}
        <Animated.View style={[styles.securityCollapse, panelStyle]}>
          <AppSettingsSubItems />
        </Animated.View>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  groupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupLabelText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flagText: {
    fontSize: 17,
  },
});
