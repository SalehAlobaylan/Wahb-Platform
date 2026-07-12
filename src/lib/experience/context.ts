// RUX client context — release identity + coarse, low-cardinality cohort
// detection. All values map to the fixed allowlisted enums in types.ts; unknown
// values fall back to safe buckets (never free-form strings).

import {
  RUX_SCHEMA_VERSION,
  type RuxBrowserFamily,
  type RuxClientContext,
  type RuxDeviceClass,
  type RuxNetworkClass,
} from './types';

// Release id is injected at build/deploy time as a single boot-time value (not a
// runtime tuning var). Falls back to 'dev' locally so events are never rejected
// for a missing release in development.
export function getRelease(): string {
  return (
    process.env.NEXT_PUBLIC_APP_RELEASE ||
    process.env.NEXT_PUBLIC_COMMIT_SHA ||
    'dev'
  ).slice(0, 80);
}

function detectBrowserFamily(ua: string): RuxBrowserFamily {
  const s = ua.toLowerCase();
  // Order matters: Edge/Samsung/Chrome all contain "safari"/"chrome" tokens.
  if (s.includes('edg/')) return 'edge';
  if (s.includes('samsungbrowser')) return 'samsung';
  if (s.includes('firefox') || s.includes('fxios')) return 'firefox';
  if (s.includes('crios') || (s.includes('chrome') && !s.includes('edg/'))) return 'chrome';
  if (s.includes('safari')) return 'safari';
  return 'other';
}

function detectBrowserMajor(ua: string, family: RuxBrowserFamily): number {
  const patterns: Record<string, RegExp> = {
    edge: /edg\/(\d+)/i,
    samsung: /samsungbrowser\/(\d+)/i,
    firefox: /(?:firefox|fxios)\/(\d+)/i,
    chrome: /(?:crios|chrome)\/(\d+)/i,
    safari: /version\/(\d+)/i,
  };
  const re = patterns[family];
  if (!re) return 0;
  const m = ua.match(re);
  const n = m ? parseInt(m[1], 10) : 0;
  return Number.isFinite(n) && n >= 0 && n <= 999 ? n : 0;
}

function detectDeviceClass(ua: string): RuxDeviceClass {
  const s = ua.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(s)) return 'tablet';
  if (/mobi|iphone|ipod|android/i.test(s)) return 'mobile';
  return 'desktop';
}

function detectNetworkClass(): RuxNetworkClass {
  // navigator.connection is Chromium-only; Safari/iOS report nothing → 'unknown'.
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  const et = conn?.effectiveType;
  if (et === 'slow-2g' || et === '2g' || et === '3g' || et === '4g') return et;
  return 'unknown';
}

function detectInstalledPwa(): boolean {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

let cachedContext: RuxClientContext | null = null;

// Detected once per page load; cohort dimensions don't change mid-session.
export function getClientContext(): RuxClientContext {
  if (cachedContext) return cachedContext;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browser_family: 'other',
      browser_major: 0,
      device_class: 'desktop',
      network_class: 'unknown',
      installed_pwa: false,
    };
  }
  const ua = navigator.userAgent || '';
  const family = detectBrowserFamily(ua);
  cachedContext = {
    browser_family: family,
    browser_major: detectBrowserMajor(ua, family),
    device_class: detectDeviceClass(ua),
    network_class: detectNetworkClass(),
    installed_pwa: detectInstalledPwa(),
  };
  return cachedContext;
}

export const SCHEMA_VERSION = RUX_SCHEMA_VERSION;
