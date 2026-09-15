import { vi, TranslationKeys } from './locales/vi';
import { en } from './locales/en';

export const translations = {
  vi,
  en,
} as const;

export type Language = keyof typeof translations;
export type { TranslationKeys };

export function translate(lang: Language, key: TranslationKeys, params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.vi;
  let text: string = dict[key] || translations.vi[key] || key;

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), String(params[paramKey]));
    });
  }

  return text;
}
