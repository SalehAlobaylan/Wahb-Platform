/**
 * Coordinates refresh-token rotation between same-origin tabs. Neither the
 * lease nor its messages authenticate a user; httpOnly cookies and IAM remain
 * the only session authority.
 */
const LOCK_NAME = 'wahb-session-refresh-v1';
const CHANNEL_NAME = 'wahb-session-refresh-v1';
const LEASE_KEY = 'wahb-session-refresh-lease-v1';
const RESULT_KEY = 'wahb-session-refresh-result-v1';
const LEASE_VERSION = 1;
const LEASE_MS = 10_000;
const PEER_RESULT_WAIT_MS = 12_000;

interface RefreshResult {
  version: number;
  type: 'refresh-complete';
  owner: string;
  success: boolean;
  completedAt: number;
}

interface RefreshLease {
  version: number;
  owner: string;
  expiresAt: number;
}

interface LockManagerLike {
  request<T>(
    name: string,
    options: { ifAvailable: boolean },
    callback: (lock: Lock | null) => Promise<T>,
  ): Promise<T>;
}

let refreshInFlight: Promise<boolean> | null = null;

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomOwner(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseLease(value: string | null): RefreshLease | null {
  try {
    const parsed = JSON.parse(value ?? 'null') as Partial<RefreshLease> | null;
    if (!parsed || parsed.version !== LEASE_VERSION || typeof parsed.owner !== 'string' || !parsed.owner || typeof parsed.expiresAt !== 'number') return null;
    return { version: LEASE_VERSION, owner: parsed.owner, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function parseResult(value: string | null): RefreshResult | null {
  try {
    const parsed = JSON.parse(value ?? 'null') as Partial<RefreshResult> | null;
    if (!parsed || parsed.version !== LEASE_VERSION || parsed.type !== 'refresh-complete' || typeof parsed.owner !== 'string' || typeof parsed.success !== 'boolean' || typeof parsed.completedAt !== 'number') return null;
    return parsed as RefreshResult;
  } catch {
    return null;
  }
}

function acquireLease(owner: string): boolean {
  const storage = browserStorage();
  if (!storage) return false;

  const current = parseLease(storage.getItem(LEASE_KEY));
  if (current && current.expiresAt > Date.now() && current.owner !== owner) return false;

  const lease: RefreshLease = { version: LEASE_VERSION, owner, expiresAt: Date.now() + LEASE_MS };
  try {
    storage.setItem(LEASE_KEY, JSON.stringify(lease));
    return parseLease(storage.getItem(LEASE_KEY))?.owner === owner;
  } catch {
    return false;
  }
}

function releaseLease(owner: string): void {
  const storage = browserStorage();
  if (!storage) return;
  try {
    if (parseLease(storage.getItem(LEASE_KEY))?.owner === owner) storage.removeItem(LEASE_KEY);
  } catch {
    // Storage is advisory coordination only.
  }
}

function publishResult(result: RefreshResult): void {
  const storage = browserStorage();
  try {
    storage?.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    // BroadcastChannel remains available on browsers that block storage.
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(result);
    channel.close();
  } catch {
    // Storage events provide the fallback result propagation.
  }
}

function isResultAfter(value: unknown, startedAt: number): value is RefreshResult {
  const result = typeof value === 'string' ? parseResult(value) : parseResult(JSON.stringify(value));
  return Boolean(result && result.completedAt >= startedAt);
}

function waitForPeerResult(startedAt: number): Promise<boolean> {
  const stored = browserStorage();
  const prior = stored ? parseResult(stored.getItem(RESULT_KEY)) : null;
  if (prior && prior.completedAt >= startedAt) return Promise.resolve(prior.success);

  return new Promise((resolve) => {
    let settled = false;
    let channel: BroadcastChannel | null = null;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('storage', onStorage);
      channel?.close();
      clearTimeout(timeout);
      resolve(success);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === RESULT_KEY && isResultAfter(event.newValue, startedAt)) {
        finish(parseResult(event.newValue)?.success ?? false);
      }
    };
    const timeout = window.setTimeout(() => finish(false), PEER_RESULT_WAIT_MS);
    window.addEventListener('storage', onStorage);
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (isResultAfter(event.data, startedAt)) {
          finish(parseResult(JSON.stringify(event.data))?.success ?? false);
        }
      };
    } catch {
      // The storage event listener above is the no-BroadcastChannel fallback.
    }
  });
}

async function clearTerminalSession(owner: string, ownsRefresh: () => boolean): Promise<void> {
  // A second tab can only become an owner in the storage fallback if it has
  // superseded this advisory lease. Re-check immediately before clearing the
  // shared httpOnly cookies so a stale loser cannot erase its newer session.
  if (!ownsRefresh()) return;
  try {
    await fetch('/api/auth/session/clear', { method: 'POST' });
  } catch {
    // Clearing is best effort. A transient local failure is not authentication
    // authority and must not turn into additional refresh attempts.
  }
}

async function performRefresh(owner: string, ownsRefresh: () => boolean = () => true): Promise<boolean> {
  let success = false;
  try {
    const response = await fetch('/api/auth/refresh', { method: 'POST' });
    success = response.ok;
    if (!success && response.status === 401) await clearTerminalSession(owner, ownsRefresh);
    return success;
  } catch {
    return false;
  } finally {
    publishResult({ version: LEASE_VERSION, type: 'refresh-complete', owner, success, completedAt: Date.now() });
  }
}

async function refreshWithLease(startedAt: number): Promise<boolean> {
  const owner = randomOwner();
  if (!acquireLease(owner)) return waitForPeerResult(startedAt);
  try {
    return await performRefresh(owner, () => parseLease(browserStorage()?.getItem(LEASE_KEY) ?? null)?.owner === owner);
  } finally {
    releaseLease(owner);
  }
}

async function refreshWithWebLock(startedAt: number, locks: LockManagerLike): Promise<boolean> {
  return locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
    if (!lock) return waitForPeerResult(startedAt);
    return performRefresh(randomOwner());
  });
}

/** One same-origin browser owner for refresh-token rotation. */
export function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!refreshInFlight) {
    const startedAt = Date.now();
    const locks = (navigator as Navigator & { locks?: LockManagerLike }).locks;
    refreshInFlight = (locks
      ? refreshWithWebLock(startedAt, locks)
      : refreshWithLease(startedAt))
      .catch(() => false)
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export function resetSessionCoordinatorForTests(): void {
  refreshInFlight = null;
  try {
    window.localStorage.removeItem(LEASE_KEY);
    window.localStorage.removeItem(RESULT_KEY);
  } catch {
    // JSDOM or privacy modes can deny storage.
  }
}

export const sessionCoordinatorTestKeys = { lease: LEASE_KEY, result: RESULT_KEY };
