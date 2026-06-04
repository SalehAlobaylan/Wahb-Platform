// Local, client-only comment store. The backend comment API is not wired yet,
// so comments are persisted per content item in localStorage. Shared by the
// News bottom sheet (BottomSheetTabs) and the ArticleReader so there is one
// implementation rather than several copies.

export interface LocalComment {
    id: string;
    author: string;
    text: string;
    time: string;
    avatar: string;
}

const storageKey = (contentId: string) => `wahb_comments_${contentId}`;

/** Read persisted comments for a content item (safe in SSR / private mode). */
export function readComments(contentId: string): LocalComment[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(storageKey(contentId));
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LocalComment[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Prepend a comment and persist. Returns the new list (unchanged if `text` is
 * blank). Swallows storage errors (quota / private browsing).
 */
export function addComment(contentId: string, text: string): LocalComment[] {
    const existing = readComments(contentId);
    const value = text.trim();
    if (!value) return existing;

    const next: LocalComment[] = [
        { id: `${Date.now()}`, author: 'You', text: value, time: 'now', avatar: 'Y' },
        ...existing,
    ];

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(storageKey(contentId), JSON.stringify(next));
        } catch {
            // ignore quota / private-mode errors
        }
    }

    return next;
}
