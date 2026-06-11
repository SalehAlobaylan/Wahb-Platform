import { formatRelativeTime, formatArticleDate } from '../time';

describe('formatRelativeTime', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-11T12:00:00Z'));
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns null for missing or invalid input', () => {
        expect(formatRelativeTime(undefined, 'en')).toBeNull();
        expect(formatRelativeTime(null, 'en')).toBeNull();
        expect(formatRelativeTime('', 'en')).toBeNull();
        expect(formatRelativeTime('not-a-date', 'en')).toBeNull();
    });

    it('formats past times in English', () => {
        expect(formatRelativeTime('2026-06-11T11:00:00Z', 'en')).toMatch(/hr|hour/);
        expect(formatRelativeTime('2026-06-08T12:00:00Z', 'en')).toMatch(/day/);
        expect(formatRelativeTime('2026-06-11T11:59:30Z', 'en')).toMatch(/sec|now/);
    });

    it('formats in Arabic for the ar locale', () => {
        const result = formatRelativeTime('2026-06-11T09:00:00Z', 'ar');
        expect(result).toBeTruthy();
        // Contains Arabic script
        expect(result!).toMatch(/[؀-ۿ]/);
    });

    it('clamps small clock skew into the future to "now" instead of "in X seconds"', () => {
        const result = formatRelativeTime('2026-06-11T12:00:05Z', 'en');
        expect(result).toBeTruthy();
        expect(result!.toLowerCase()).not.toContain('in ');
    });
});

describe('formatArticleDate', () => {
    it('returns null for missing or invalid input', () => {
        expect(formatArticleDate(undefined, 'en')).toBeNull();
        expect(formatArticleDate('garbage', 'en')).toBeNull();
    });

    it('formats a full date in the requested locale', () => {
        expect(formatArticleDate('2026-06-11T09:00:00Z', 'en')).toContain('2026');
        expect(formatArticleDate('2026-06-11T09:00:00Z', 'ar')).toMatch(/[؀-ۿ]/);
    });
});
