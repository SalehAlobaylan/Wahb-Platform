'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Locale, isLocale, getDirection } from './locales';
import type { Messages } from './messages';
import { getClientMessages } from './utils';

const STORAGE_KEY = 'wahb_locale';
const LOCALE_COOKIE = 'wahb_locale';

function readStoredLocale(fallback: Locale): Locale {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return fallback;
}

function writeStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}`;
}

export function useLocale(initialLocale: Locale, initialMessages: Messages) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale(initialLocale));
  const [messages, setMessages] = useState<Messages>(initialMessages);

  useEffect(() => {
    let active = true;
    (async () => {
      const next = await getClientMessages(locale);
      if (active) {
        setMessages(next);
      }
    })();
    return () => {
      active = false;
    };
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    writeStoredLocale(nextLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = getDirection(nextLocale);
    }
  };

  return useMemo(
    () => ({ locale, messages, setLocale }),
    [locale, messages]
  );
}
