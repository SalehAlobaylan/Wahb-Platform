import type { ContentItem } from '@/types';

/**
 * Honest content-type badge — the single source of truth for the type chip shown
 * on news slides, coverage rows, related cards, and the article reader.
 *
 * Returns an i18n key (caller does `t(...)`). Telegram beats format because a
 * Telegram channel post ingests as `format=ARTICLE` yet should read as Telegram,
 * not as a generic article. Tweets/comments keep their real shape instead of the
 * old editorial "Opinion"/"Reaction" labels.
 */
export function typeBadgeKey(item: Pick<ContentItem, 'type' | 'source'>): string {
    if (item.source === 'TELEGRAM') return 'news.badge.telegram';
    switch (item.type) {
        case 'TWEET':
            return 'news.badge.tweet';
        case 'COMMENT':
            return 'news.badge.comment';
        case 'VIDEO':
            return 'news.badge.video';
        case 'PODCAST':
            return 'news.badge.audio';
        default:
            return 'news.badge.article';
    }
}

/**
 * Finite news-category taxonomy → i18n key. Keep the slug set in sync with the
 * Enrichment classifier (`topic_digest.py CATEGORIES`) and CMS. `general` and any
 * unknown slug are intentionally absent → no chip.
 */
export const CATEGORY_LABEL_KEY: Record<string, string> = {
    politics: 'news.category.politics',
    economy: 'news.category.economy',
    world: 'news.category.world',
    conflict: 'news.category.conflict',
    sports: 'news.category.sports',
    technology: 'news.category.technology',
    science: 'news.category.science',
    health: 'news.category.health',
    culture: 'news.category.culture',
    society: 'news.category.society',
};

/**
 * i18n key for a story's topic chip, or `null` when the category is missing,
 * `general`, or unknown — in which case the UI renders no chip.
 */
export function categoryBadgeKey(category?: string): string | null {
    if (!category) return null;
    return CATEGORY_LABEL_KEY[category.toLowerCase()] ?? null;
}
