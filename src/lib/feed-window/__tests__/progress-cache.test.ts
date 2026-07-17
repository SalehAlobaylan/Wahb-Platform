import {
  MAX_PLAYBACK_AGE_MS,
  MAX_RECENT_PLAYBACK_ENTRIES,
  pruneRecentPlayback,
  writeRecentPlayback,
} from '@/lib/feed-window/progress-cache';

describe('recent playback cache', () => {
  const now = 1_800_000_000_000;

  it('keeps the newest bounded entries and protects the current write', () => {
    let entries = {};
    for (let index = 0; index < MAX_RECENT_PLAYBACK_ENTRIES + 10; index += 1) {
      entries = writeRecentPlayback(entries, `item-${index}`, index, index, now + index);
    }

    expect(Object.keys(entries)).toHaveLength(MAX_RECENT_PLAYBACK_ENTRIES);
    expect(entries).toHaveProperty(`item-${MAX_RECENT_PLAYBACK_ENTRIES + 9}`);
    expect(entries).not.toHaveProperty('item-0');
  });

  it('drops corrupt and expired hydration values', () => {
    expect(
      pruneRecentPlayback({
        fresh: { timeSec: 12, progress: 40, updatedAt: now },
        expired: { timeSec: 8, progress: 20, updatedAt: now - MAX_PLAYBACK_AGE_MS - 1 },
        corrupt: { timeSec: 'not-a-number', progress: 1, updatedAt: now },
      }, now)
    ).toEqual({ fresh: { timeSec: 12, progress: 40, updatedAt: now } });
  });
});
