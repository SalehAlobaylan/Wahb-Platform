import { getAnonymousSessionId } from './session';

let authenticatedPartition: { userId: string; key: string } | null = null;

function newOpaqueKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * An in-memory cache partition only. Authenticated identity still comes from
 * the verified auth store; the user id is never put in a query key or storage.
 */
export function identityCacheKey(userId?: string | null): string {
  if (!userId) return `anonymous:${getAnonymousSessionId() ?? 'unavailable'}`;

  if (authenticatedPartition?.userId !== userId) {
    authenticatedPartition = { userId, key: newOpaqueKey() };
  }
  return `authenticated:${authenticatedPartition.key}`;
}

/** Test-only reset for deterministic identity-key coverage. */
export function resetIdentityCacheKeyForTests(): void {
  authenticatedPartition = null;
}
