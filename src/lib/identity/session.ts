const ANONYMOUS_SESSION_STORAGE_KEY = 'wahb_session_id';

/**
 * Returns the canonical anonymous identity for this browser tab.
 *
 * Anonymous engagement is intentionally session-scoped: it must never be
 * written to localStorage or reused by a different tab. Storage can be
 * unavailable in privacy modes, in which case callers simply omit it.
 */
export function getAnonymousSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.sessionStorage.getItem(ANONYMOUS_SESSION_STORAGE_KEY);
    if (existing) return existing;

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.sessionStorage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}
