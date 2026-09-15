import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../api/services/userService';
import { getStoredUserId, subscribeSession } from '../services/session.service';
import { translate, Language, TranslationKeys, translations as i18nTranslations } from '../i18n';

export type ThemeMode = 'light' | 'dark' | 'system';
export type { Language, TranslationKeys };

export const DEFAULT_THEME_MODE: ThemeMode = 'light';
export const DEFAULT_LANGUAGE: Language = 'vi';

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  bgSoft: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  headerGradient: readonly [string, string, string];
  navHeaderBg: string;
  statusBarStyle: 'dark-content' | 'light-content';
  shadowColor: string;
  iconColor: string;
  divider: string;
  // Extended Utility Color Tokens
  inputBg: string;
  inputBorder: string;
  inputText: string;
  subtleCard: string;
  overlay: string;
  badgeBg: string;
  badgeText: string;
  success: string;
  error: string;
  warning: string;
}

export const LIGHT_THEME: ThemeColors = {
  isDark: false,
  bg: '#FFF8FC',
  bgSoft: '#FFF1F8',
  card: '#FFFFFF',
  cardBorder: '#F3E8FF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#EC4899',
  primaryDark: '#BE185D',
  primarySoft: '#FCE7F3',
  headerGradient: ['#FFD6EC', '#E9D5FF', '#BFDBFE'],
  navHeaderBg: '#FFFFFF',
  statusBarStyle: 'dark-content',
  shadowColor: 'rgba(236, 72, 153, 0.08)',
  iconColor: '#EC4899',
  divider: '#F3E8FF',

  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputText: '#1F2937',
  subtleCard: '#F9FAFB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  badgeBg: '#FCE7F3',
  badgeText: '#BE185D',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const DARK_THEME: ThemeColors = {
  isDark: true,
  bg: '#181E2A',
  bgSoft: '#222836',
  card: '#222836',
  cardBorder: '#343D52',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#F472B6',
  primaryDark: '#EC4899',
  primarySoft: '#3A2033',
  headerGradient: ['#231E48', '#381C47', '#252D40'],
  navHeaderBg: '#222836',
  statusBarStyle: 'light-content',
  shadowColor: 'rgba(0, 0, 0, 0.25)',
  iconColor: '#F472B6',
  divider: '#343D52',

  inputBg: '#2C3446',
  inputBorder: '#424E66',
  inputText: '#F8FAFC',
  subtleCard: '#272F40',
  overlay: 'rgba(0, 0, 0, 0.65)',
  badgeBg: '#3A2033',
  badgeText: '#F472B6',
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
};

export const translations = i18nTranslations;
export type TranslationKey = TranslationKeys;

interface ThemeLanguageContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  theme: ThemeColors;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const STORAGE_THEME_KEY = '@smartspend_theme_mode';
const STORAGE_LANG_KEY = '@smartspend_language';

function appearanceStorageKey(userId: string) {
  return `@smartspend_appearance:user:${userId}`;
}

function parseThemeMode(value?: string | null): ThemeMode {
  if (value === 'dark' || value === 'system' || value === 'light') return value;
  return DEFAULT_THEME_MODE;
}

function parseLanguage(value?: string | null): Language {
  return value === 'en' ? 'en' : DEFAULT_LANGUAGE;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const userIdRef = useRef<string | null>(null);
  const themeModeRef = useRef<ThemeMode>(DEFAULT_THEME_MODE);
  const languageRef = useRef<Language>(DEFAULT_LANGUAGE);

  const applyAppearance = useCallback((nextTheme: ThemeMode, nextLang: Language) => {
    themeModeRef.current = nextTheme;
    languageRef.current = nextLang;
    setThemeModeState(nextTheme);
    setLanguageState(nextLang);
  }, []);

  const cacheLocal = useCallback(async (userId: string, nextTheme: ThemeMode, nextLang: Language) => {
    await AsyncStorage.setItem(
      appearanceStorageKey(userId),
      JSON.stringify({ themeMode: nextTheme, language: nextLang }),
    );
  }, []);

  const reloadForCurrentUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        userIdRef.current = null;
        applyAppearance(DEFAULT_THEME_MODE, DEFAULT_LANGUAGE);
        return;
      }

      try {
        const profile = await userService.getMyProfile();
        const userId = String(profile.id);
        await AsyncStorage.setItem('userId', userId);
        userIdRef.current = userId;
        const nextTheme = parseThemeMode(profile.themeMode);
        const nextLang = parseLanguage(profile.language);
        await cacheLocal(userId, nextTheme, nextLang);
        applyAppearance(nextTheme, nextLang);
      } catch {
        const userId = (await getStoredUserId()) ?? (await AsyncStorage.getItem('userEmail'));
        userIdRef.current = userId;
        if (!userId) {
          applyAppearance(DEFAULT_THEME_MODE, DEFAULT_LANGUAGE);
          return;
        }
        const raw = await AsyncStorage.getItem(appearanceStorageKey(userId));
        if (raw) {
          const parsed = JSON.parse(raw) as { themeMode?: string; language?: string };
          applyAppearance(parseThemeMode(parsed.themeMode), parseLanguage(parsed.language));
          return;
        }
        const legacyTheme = await AsyncStorage.getItem(STORAGE_THEME_KEY);
        const legacyLang = await AsyncStorage.getItem(STORAGE_LANG_KEY);
        applyAppearance(parseThemeMode(legacyTheme), parseLanguage(legacyLang));
      }
    } catch (error) {
      console.error('Failed to load theme/language preferences:', error);
    }
  }, [applyAppearance, cacheLocal]);

  useEffect(() => {
    void reloadForCurrentUser();
    return subscribeSession(() => {
      void reloadForCurrentUser();
    });
  }, [reloadForCurrentUser]);

  const persistAppearance = useCallback(
    async (nextTheme: ThemeMode, nextLang: Language) => {
      applyAppearance(nextTheme, nextLang);
      const userId = userIdRef.current;
      if (userId) {
        try {
          await cacheLocal(userId, nextTheme, nextLang);
        } catch {
          // ignore local cache errors
        }
      }
      try {
        await userService.updateAppearance({ themeMode: nextTheme, language: nextLang });
      } catch {
        // keep optimistic local; server wins on next login if API succeeds later
      }
    },
    [applyAppearance, cacheLocal],
  );

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    await persistAppearance(mode, languageRef.current);
  }, [persistAppearance]);

  const setLanguage = useCallback(async (lang: Language) => {
    await persistAppearance(themeModeRef.current, lang);
  }, [persistAppearance]);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const t = useCallback((key: TranslationKeys, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  }, [language]);

  const contextValue = useMemo(() => ({
    themeMode,
    setThemeMode,
    isDark,
    theme,
    language,
    setLanguage,
    t,
  }), [themeMode, setThemeMode, isDark, theme, language, setLanguage, t]);

  return (
    <ThemeLanguageContext.Provider value={contextValue}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeLanguageProvider');
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
    isDark: context.isDark,
    theme: context.theme,
  };
};

export const useLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a ThemeLanguageProvider');
  }
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t: context.t,
  };
};

export const useTranslation = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a ThemeLanguageProvider');
  }
  return context.t;
};
