/**
 * Query families which may include session- or account-specific fields.
 * Keep this registry as the single transition boundary rather than clearing
 * ad-hoc query keys from individual pages.
 */
export const IDENTITY_OWNED_QUERY_ROOTS = new Set([
  'feed',
  'bookmarks',
  'my-likes',
  'my-content',
  'watch-history',
  'comments',
  'user-stats',
  'preferences',
]);

export function isIdentityOwnedQuery(queryKey: readonly unknown[]): boolean {
  return IDENTITY_OWNED_QUERY_ROOTS.has(String(queryKey[0]));
}
