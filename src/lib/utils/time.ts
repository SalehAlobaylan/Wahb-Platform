/**
 * Locale-aware time formatting for content timestamps.
 *
 * Uses the built-in Intl APIs so Arabic ("قبل ٣ ساعات") and English
 * ("3 hours ago") both come for free — no message keys needed.
 */
import type { Locale } from '@/lib/i18n/locales';

const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

/**
 * "3h ago" / "قبل ٣ ساعات" style relative time. Returns null when the input
 * is missing or unparseable so callers can simply omit the element.
 */
export function formatRelativeTime(
    dateStr: string | undefined | null,
    locale: Locale
): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;

    let delta = (date.getTime() - Date.now()) / 1000;
    // Clock skew between server and client can put fresh items a few seconds
    // in the future — clamp those to "now" instead of showing "in 5 seconds".
    if (delta > 0 && delta < 60) delta = 0;

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
    for (const division of DIVISIONS) {
        if (Math.abs(delta) < division.amount) {
            return rtf.format(Math.round(delta), division.unit);
        }
        delta /= division.amount;
    }
    return null;
}

/**
 * Format a media duration in seconds as `m:ss` (e.g. 3:45). Returns null for
 * missing/zero durations so callers can omit the element.
 */
export function formatDuration(sec?: number): string | null {
    if (!sec) return null;
    const total = Math.max(0, Math.floor(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Absolute date for the article reader header, in the user's locale
 * (e.g. "June 11, 2026" / "١١ يونيو ٢٠٢٦"). Returns null on bad input
 * instead of rendering "Invalid Date".
 */
export function formatArticleDate(
    dateStr: string | undefined | null,
    locale: Locale
): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(locale === 'ar' ? 'ar' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}
