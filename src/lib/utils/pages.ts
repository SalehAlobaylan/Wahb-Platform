/**
 * Flatten the pages of an infinite query into a single de-duplicated list,
 * preserving order and keeping the first occurrence of each id. Shared by the
 * Saved page and the profile Saved/Likes tabs.
 */
export function flattenPages<T extends { id: string }>(
    data: { pages?: Array<{ items: T[] }> } | undefined
): T[] {
    if (!data?.pages) return [];
    const seen = new Set<string>();
    const out: T[] = [];
    for (const page of data.pages) {
        for (const item of page.items) {
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            out.push(item);
        }
    }
    return out;
}
