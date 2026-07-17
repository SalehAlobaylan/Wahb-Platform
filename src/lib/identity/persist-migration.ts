/**
 * Version 1 stored liked/bookmarked ids without an owner. They are unsafe to
 * migrate because a shared browser cannot prove which account created them.
 */
export function migrateFeedPersistedState(persistedState: unknown): Record<string, unknown> {
  if (!persistedState || typeof persistedState !== 'object' || Array.isArray(persistedState)) {
    return {};
  }

  const safeState = { ...(persistedState as Record<string, unknown>) };
  delete safeState.likedIds;
  delete safeState.bookmarkedIds;
  delete safeState.sessionId;
  return safeState;
}
