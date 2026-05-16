'use client';

import { useMemo } from 'react';
import { useI18n } from './context';

type Variables = Record<string, string | number>;

function formatMessage(template: string, vars?: Variables) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function useTranslations(namespace?: string) {
  const { messages } = useI18n();

  return useMemo(() => {
    return (key: string, vars?: Variables) => {
      const resolvedKey = namespace ? `${namespace}.${key}` : key;
      const value = messages[resolvedKey] ?? messages[key] ?? resolvedKey;
      return formatMessage(value, vars);
    };
  }, [messages, namespace]);
}
