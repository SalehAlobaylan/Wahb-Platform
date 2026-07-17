export interface PlaybackProgress {
  timeSec: number;
  progress: number;
  updatedAt: number;
}

export const MAX_RECENT_PLAYBACK_ENTRIES = 100;
export const MAX_PLAYBACK_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Keep recent, valid resume points only; the newest write is always retained. */
export function writeRecentPlayback(
  entries: Record<string, PlaybackProgress>,
  id: string,
  timeSec: number,
  progress: number,
  now = Date.now()
): Record<string, PlaybackProgress> {
  const minUpdatedAt = now - MAX_PLAYBACK_AGE_MS;
  const next = Object.entries(entries)
    .filter(([, value]) =>
      Number.isFinite(value.timeSec) &&
      Number.isFinite(value.progress) &&
      Number.isFinite(value.updatedAt) &&
      value.updatedAt >= minUpdatedAt
    )
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RECENT_PLAYBACK_ENTRIES - 1);

  return Object.fromEntries([
    [id, { timeSec: Math.max(0, timeSec), progress: Math.max(0, Math.min(100, progress)), updatedAt: now }],
    ...next.filter(([entryId]) => entryId !== id),
  ]);
}

/** Hydration path for legacy, corrupt, or overlarge persisted maps. */
export function pruneRecentPlayback(
  entries: unknown,
  now = Date.now()
): Record<string, PlaybackProgress> {
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return {};

  const normalized: Record<string, PlaybackProgress> = {};
  for (const [id, value] of Object.entries(entries as Record<string, Partial<PlaybackProgress>>)) {
    if (!value || typeof value !== 'object') continue;
    const updatedAt = Number(value.updatedAt);
    const timeSec = Number(value.timeSec);
    const progress = Number(value.progress);
    if (!Number.isFinite(updatedAt) || !Number.isFinite(timeSec) || !Number.isFinite(progress)) continue;
    normalized[id] = { timeSec: Math.max(0, timeSec), progress: Math.max(0, Math.min(100, progress)), updatedAt };
  }

  return Object.fromEntries(
    Object.entries(normalized)
      .filter(([, value]) => value.updatedAt >= now - MAX_PLAYBACK_AGE_MS)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_RECENT_PLAYBACK_ENTRIES)
  );
}
