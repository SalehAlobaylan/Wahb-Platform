import type { Locale } from './locales';

export type Messages = Record<string, string>;

const cache = new Map<Locale, Messages>();

export async function getMessages(locale: Locale): Promise<Messages> {
  const cached = cache.get(locale);
  if (cached) return cached;

  let messages: Messages;
  switch (locale) {
    case 'en':
      messages = (await import('../../messages/en.json')).default as Messages;
      break;
    case 'ar':
    default:
      messages = (await import('../../messages/ar.json')).default as Messages;
      break;
  }

  cache.set(locale, messages);
  return messages;
}
