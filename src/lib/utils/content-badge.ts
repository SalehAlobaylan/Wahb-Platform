import type { ContentItem } from '@/types';
import { isHtml, stripHtml } from '@/lib/utils/html';

/**
 * Word count above which a piece reads as a long-form "article" regardless of
 * its origin (a long tweet/Telegram post or a full web article all qualify).
 * NOTE: the feed caps `body_text` at ~600 chars, so in practice this flags items
 * carrying a substantial body (full articles) over short snippets/posts.
 */
const ARTICLE_MIN_WORDS = 80;

function articleWordCount(item: Pick<ContentItem, 'body_text' | 'excerpt'>): number {
    const raw =
        (item.body_text?.length ?? 0) >= (item.excerpt?.length ?? 0) ? item.body_text : item.excerpt;
    if (!raw) return 0;
    const text = (isHtml(raw) ? stripHtml(raw) : raw).trim();
    return text ? text.split(/\s+/).length : 0;
}

type BadgeItem = Pick<ContentItem, 'type' | 'source' | 'source_name' | 'body_text' | 'excerpt'>;

/**
 * Resolve the type-badge LABEL (already translated) for a content item:
 *
 *   1. VIDEO / PODCAST keep their media badge.
 *   2. Long-form text (≥ ARTICLE_MIN_WORDS) → "Article" (مقال) — GLOBAL: earned by
 *      length, not by being RSS. A long tweet or Telegram post reads as an article.
 *   3. Telegram / Tweet / Comment → their honest origin badge.
 *   4. Otherwise (RSS / website / unknown) → the SOURCE'S OWN NAME — an RSS item is
 *      "a website", identified by which site it came from, not a generic "مقال".
 */
export function typeBadgeLabel(item: BadgeItem, t: (key: string) => string): string {
    if (item.type === 'VIDEO') return t('news.badge.video');
    if (item.type === 'PODCAST') return t('news.badge.audio');
    if (articleWordCount(item) >= ARTICLE_MIN_WORDS) return t('news.badge.article');
    if (item.source === 'TELEGRAM') return t('news.badge.telegram');
    if (item.type === 'TWEET') return t('news.badge.tweet');
    if (item.type === 'COMMENT') return t('news.badge.comment');
    return item.source_name?.trim() || t('news.badge.website');
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
