import DOMPurify from 'isomorphic-dompurify';

/** Detect if text contains HTML tags. */
export const isHtml = (text: string): boolean => /<[a-z][\s\S]*>/i.test(text);

/**
 * Sanitize untrusted HTML for rendering via `dangerouslySetInnerHTML`.
 *
 * Content here originates from external scraping (Telegram / Twitter / RSS) and
 * is therefore attacker-influenceable. A regex "sanitizer" is trivially
 * bypassable (unquoted/`/`-separated handlers, `javascript:` URLs, `<svg onload>`,
 * …), so we delegate to DOMPurify, which parses the DOM and removes scripts,
 * event handlers, and dangerous URLs. We additionally forbid embedding/layout
 * tags and inline styles to keep scraped markup visually contained.
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['style', 'form', 'iframe', 'object', 'embed', 'script'],
        FORBID_ATTR: ['style'],
    });
}

/** Strip all HTML tags to plain text (collapses whitespace). */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
