import { defaultLocale, type Locale } from './locales';
import type { Messages } from './messages';

export async function getClientMessages(locale: Locale): Promise<Messages> {
  if (locale === 'en') {
    return (await import('../../messages/en.json')).default as Messages;
  }
  return (await import('../../messages/ar.json')).default as Messages;
}

export function getLocaleFromCookies(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return defaultLocale;
  const match = cookieHeader.match(/(?:^|;\s*)wahb_locale=([^;]+)/);
  const value = match?.[1];
  if (value === 'en') return 'en';
  if (value === 'ar') return 'ar';
  return defaultLocale;
}
