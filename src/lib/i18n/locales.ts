export const locales = ['ar', 'en'] as const;

export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'ar';

export function isLocale(value: string | undefined | null): value is Locale {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
