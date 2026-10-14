import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import type { RuxEvent } from '../../src/lib/experience/types';

test.setTimeout(60_000);
test.beforeAll(() => {
  if (process.env.PLAYWRIGHT_EXTERNAL_STACK !== '1') throw new Error('Run RUX browser tests against ./start.sh with PLAYWRIGHT_EXTERNAL_STACK=1');
  const runtime = JSON.parse(readFileSync('../.run/active-runtime.json', 'utf8'));
  if (runtime.state !== 'running') throw new Error('The supported full launcher must be running');
});
const id = (number: number) => '00000000-0000-4000-8000-' + String(number).padStart(12, '0');
const podID = id(101);
const newsID = id(201);
const capturedEvents = new WeakMap<Page, RuxEvent[]>();
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return;
  const eventPath = info.outputPath('rux-outcomes.json');
  writeFileSync(eventPath, JSON.stringify(capturedEvents.get(page) || [], null, 2));
  await info.attach('rux-outcomes', { path: eventPath, contentType: 'application/json' });
  const media = await page.locator('audio,video').evaluateAll(elements => elements.map(element => {
    const media = element as HTMLMediaElement;
    return { src: media.getAttribute('src'), paused: media.paused, time: media.currentTime,
      ready: media.readyState, seeking: media.seeking, error: media.error?.code };
  })).catch(() => []);
  const mediaPath = info.outputPath('media-state.json');
  writeFileSync(mediaPath, JSON.stringify(media, null, 2));
  await info.attach('media-state', { path: mediaPath, contentType: 'application/json' });
  const timelinePath = info.outputPath('media-timeline.json');
  writeFileSync(timelinePath, JSON.stringify(await page.evaluate(() => (window as unknown as { ruxMediaTimeline?: unknown[] }).ruxMediaTimeline || []).catch(() => []), null, 2));
  await info.attach('media-timeline', { path: timelinePath, contentType: 'application/json' });
});
const now = new Date().toISOString();
const counts = { like_count: 0, comment_count: 0, share_count: 0, view_count: 0 };
const pod = (number: number) => ({
  id: id(number), type: 'PODCAST', status: 'READY', title: 'Fixture listening ' + number,
  source: 'PODCAST', source_name: 'Fixture source', playback_url: '/rux-fixture.wav',
  playback_type: 'audio', media_url: '/rux-fixture.wav', has_video: false, visual_available: false,
  duration_sec: 300, duration_bucket: '5m', published_at: now, created_at: now, ...counts,
});
const article = { id: newsID, type: 'ARTICLE', title: 'Fixture news', source_name: 'Fixture publication',
  source: 'RSS', published_at: now, created_at: now, body_text: 'Complete fixture body. '.repeat(80), ...counts };
const slide = { slide_id: id(301), related: [], featured: {
  story_id: id(401), lead_id: newsID, label: 'Fixture news', title: 'Fixture news',
  member_count: 1, source_count: 1, lifecycle: 'active', last_member_at: now,
  published_at: now, ...counts, members: [{ ...article, type: 'NEWS', format: 'ARTICLE', body_text: 'Preview only.' }],
} };

function silentWave() {
  const samples = 8000 * 300;
  const bytes = Buffer.alloc(44 + samples, 128);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + samples, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24); bytes.writeUInt32LE(8000, 28); bytes.writeUInt16LE(1, 32); bytes.writeUInt16LE(8, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples, 40);
  return bytes;
}

// This leg proves browser measurements and fixture contracts. Every business
// API call and every telemetry batch is intercepted; it cannot persist fixture
// interactions, impressions, demand, ranking or RUX into a retained environment.
async function browserFixture(page: Page, options: { readerFailure?: boolean; readerDelay?: number; pagination?: boolean; fallback?: boolean; podsFeedFailure?: boolean } = {}) {
  const events: RuxEvent[] = [];
  capturedEvents.set(page, events);
  await page.addInitScript(() => {
    const timeline: unknown[] = [];
    (window as unknown as { ruxMediaTimeline: unknown[] }).ruxMediaTimeline = timeline;
    for (const type of ['loadstart', 'loadedmetadata', 'canplay', 'seeking', 'seeked', 'pause', 'playing', 'error', 'timeupdate']) {
      document.addEventListener(type, event => {
        if (!(event.target instanceof HTMLMediaElement)) return;
        const media = event.target;
        timeline.push({ type, at: performance.now(), src: media.getAttribute('src'),
          time: media.currentTime, paused: media.paused, ready: media.readyState,
          global: media.classList.contains('hidden') });
        if (timeline.length > 500) timeline.shift();
      }, true);
    }
  });
  let podsFailing = Boolean(options.podsFeedFailure);
  let pageRequested = false;
  let businessRequests = 0;
  let interceptedBusinessRequests = 0;
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/') && path !== '/api/experience/events' && request.method() !== 'GET') businessRequests++;
  });
  await page.route('**/rux-fixture.wav', route => {
    const wave = silentWave();
    const match = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range || '');
    if (!match) return route.fulfill({ contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes' }, body: wave });
    const start = Number(match[1]);
    const end = Math.min(wave.length - 1, match[2] ? Number(match[2]) : wave.length - 1);
    if (start > end) return route.fulfill({ status: 416, headers: { 'content-range': 'bytes */' + wave.length }, body: '' });
    return route.fulfill({ status: 206, contentType: 'audio/wav', headers: {
      'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${wave.length}`,
    }, body: wave.subarray(start, end + 1) });
  });
  await page.route('**/rux-broken.wav', route => route.fulfill({ status: 404, body: '' }));
  await page.route('**/api/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET' && path !== '/api/experience/events') interceptedBusinessRequests++;
    if (path === '/api/experience/events') {
      const batch = request.postDataJSON(); events.push(...(batch.events || []));
      return route.fulfill({ json: { accepted: batch.events?.length || 0, duplicate: 0, rejected: 0 } });
    }
    if (path.endsWith('/feed/pods/sessions') && podsFailing) return route.fulfill({ status: 503, json: { error: 'Fixture feed unavailable' } });
    if (path.endsWith('/feed/pods/sessions')) return route.fulfill({ json: { data: {
      session_id: id(501), expires_at: new Date(Date.now() + 3600000).toISOString(),
      items: [options.fallback ? { ...pod(101), playback_url: '/rux-broken.wav', media_url: '/rux-broken.wav',
        fallback_playback_url: '/rux-fixture.wav', fallback_playback_type: 'audio', fallback_has_video: false } : pod(101), pod(102), pod(103)],
      caught_up: !options.pagination, cursor: options.pagination ? 'next' : null,
    } } });
    if (path.includes('/feed/pods/sessions/')) {
      if (path.endsWith('/freshness')) return route.fulfill({ json: { data: { has_new_content: false } } });
      pageRequested = true;
      await new Promise(resolve => setTimeout(resolve, 2500));
      return route.fulfill({ json: { data: { session_id: id(501), expires_at: new Date(Date.now() + 3600000).toISOString(),
        items: [pod(104), pod(105), pod(106)], caught_up: true, cursor: null } } });
    }
    if (path.endsWith('/feed/news')) return route.fulfill({ json: { data: { slides: [slide], cursor: null } } });
    if (path.includes('/content/' + newsID)) {
      await new Promise(resolve => setTimeout(resolve, options.readerDelay || 0));
      return route.fulfill(options.readerFailure ? { status: 404, json: { error: 'Fixture missing body' } } : { json: { data: article } });
    }
    if (request.method() !== 'GET') {
      // Never call route.continue()/fallback() here.
      return route.fulfill({ json: { data: { id: id(601) } } });
    }
    if (path.startsWith('/api/auth/')) return route.fulfill({ status: 401, json: { message: 'Fixture anonymous session' } });
    return route.fulfill({ json: { data: { items: [], cursor: null } } });
  });
  return { events, recoverPods: () => { podsFailing = false; }, pageRequested: () => pageRequested, businessRequests: () => businessRequests,
    interceptedBusinessRequests: () => interceptedBusinessRequests };
}
const outcome = (events: RuxEvent[], phase: string, value: string) => events.find(event => event.event_type === 'journey_terminal' && event.phase === phase && event.outcome === value);

test('managed plain-body admission stays quiet and isolates stale launches', async ({ request, baseURL }) => {
  const runtime = JSON.parse(readFileSync('../.run/active-runtime.json', 'utf8')).id as string;
  // Only empty real telemetry HTTP probes cross the fixture boundary. Loading
  // the live product document is unnecessary and could start unrelated work.
  const headers = { origin: new URL(baseURL!).origin, 'content-type': 'text/plain' };
  const current = await request.post('/api/experience/events', { headers, data: JSON.stringify({ schema_version: 2, runtime_id: runtime, events: [] }), maxRedirects: 0 });
  const stale = await request.post('/api/experience/events', { headers, data: JSON.stringify({ schema_version: 2, runtime_id: 'previous-launch', events: [] }), maxRedirects: 0 });
  const oversized = await request.post('/api/experience/events', { headers, data: 'x'.repeat(65537), maxRedirects: 0 });
  expect({ current: current.status(), stale: stale.status(), oversized: oversized.status() }).toEqual({ current: 200, stale: 409, oversized: 400 });
  expect(stale.headers().location).toBeUndefined();
});

test('a usable feed and real media-clock progress settle successful outcomes', async ({ page }) => {
  const fixture = await browserFixture(page);
  await page.goto('/app');
  const card = page.locator('[data-rux-unit="' + podID + '"]');
  await expect(card).toBeVisible();
  const audio = card.locator('audio');
  if (await audio.evaluate(element => (element as HTMLAudioElement).paused)) await card.getByTestId('pods-audio-play-pause').click();
  await expect.poll(() => Boolean(outcome(fixture.events, 'feed', 'success')), { timeout: 15000 }).toBe(true);
  await expect.poll(() => Boolean(outcome(fixture.events, 'startup', 'success')), { timeout: 15000 }).toBe(true);
  expect(fixture.events.every(event => event.schema_version === 2)).toBe(true);
  expect(fixture.businessRequests()).toBeGreaterThan(0);
  expect(fixture.interceptedBusinessRequests()).toBe(fixture.businessRequests());
});

test('playing without progress reaches a bounded startup timeout', async ({ page }) => {
  const fixture = await browserFixture(page);
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      Object.defineProperty(this, 'paused', { configurable: true, value: false });
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () { Object.defineProperty(this, 'paused', { configurable: true, value: true }); };
  });
  await page.goto('/app');
  await expect(page.locator('[data-rux-unit="' + podID + '"]')).toBeVisible();
  await expect.poll(() => Boolean(outcome(fixture.events, 'startup', 'timeout')), { timeout: 20000 }).toBe(true);
  expect(outcome(fixture.events, 'startup', 'success')).toBeUndefined();
});

test('reader readiness includes the deep-link full-body request', async ({ page }) => {
  const fixture = await browserFixture(page, { readerDelay: 1200 });
  await page.goto('/news?item=' + newsID);
  await expect(page.getByText(/Complete fixture body/).first()).toBeVisible();
  await expect.poll(() => Boolean(outcome(fixture.events, 'reader', 'success')), { timeout: 15000 }).toBe(true);
  expect(outcome(fixture.events, 'reader', 'success')!.measurements!.duration_ms).toBeGreaterThanOrEqual(1000);
});

test('reader full-body failure cannot settle as preview success', async ({ page }) => {
  const fixture = await browserFixture(page, { readerFailure: true });
  await page.goto('/news?item=' + newsID);
  await expect.poll(() => Boolean(outcome(fixture.events, 'reader', 'failed') || outcome(fixture.events, 'reader', 'timeout')), { timeout: 25000 }).toBe(true);
  expect(outcome(fixture.events, 'reader', 'success')).toBeUndefined();
});

test('slow pagination retains loaded-boundary starvation after eventual delivery', async ({ page }) => {
  const fixture = await browserFixture(page, { pagination: true });
  await page.goto('/app');
  await expect(page.locator('[data-rux-unit="' + podID + '"]')).toBeVisible();
  await page.locator('[data-rux-unit]').last().scrollIntoViewIfNeeded();
  await expect.poll(fixture.pageRequested).toBe(true);
  await page.locator('[data-rux-unit]').last().evaluate(element => {
    const parent = element.closest('.overflow-y-scroll');
    if (parent) { parent.scrollTop = parent.scrollHeight; parent.dispatchEvent(new Event('scroll')); }
  });
  await expect.poll(() => Boolean(outcome(fixture.events, 'pagination', 'success')), { timeout: 15000 }).toBe(true);
  expect(outcome(fixture.events, 'pagination', 'success')!.measurements?.boundary_starved).toBe(true);
});

test('approved fallback recovers one user startup attempt', async ({ page }) => {
  const fixture = await browserFixture(page, { fallback: true });
  await page.goto('/app');
  const card = page.locator('[data-rux-unit="' + podID + '"]');
  await expect(card).toBeVisible();
  const audio = card.locator('audio');
  if (await audio.evaluate(element => (element as HTMLAudioElement).paused)) await card.getByTestId('pods-audio-play-pause').click();
  await expect.poll(() => Boolean(outcome(fixture.events, 'fallback', 'success')), { timeout: 15000 }).toBe(true);
  expect(outcome(fixture.events, 'startup', 'success')?.measurements?.fallback_used).toBe(true);
  expect(fixture.events.filter(event => event.event_type === 'journey_terminal' && event.phase === 'startup' && event.outcome !== 'cancelled' && event.outcome !== 'autoplay_blocked')).toHaveLength(1);
});

test('listening summary deduplicates stalled-clock observations', async ({ page }) => {
  const fixture = await browserFixture(page);
  await page.goto('/app');
  const card = page.locator('[data-rux-unit="' + podID + '"]');
  await expect(card).toBeVisible();
  const audio = card.locator('audio');
  if (await audio.evaluate(element => (element as HTMLAudioElement).paused)) await card.getByTestId('pods-audio-play-pause').click();
  await expect.poll(() => Boolean(outcome(fixture.events, 'startup', 'success')), { timeout: 15000 }).toBe(true);
  await audio.evaluate(element => {
    const media = element as HTMLMediaElement;
    media.dispatchEvent(new Event('timeupdate'));
    const position = media.currentTime;
    Object.defineProperty(media, 'currentTime', { configurable: true, get: () => position });
    media.dispatchEvent(new Event('waiting'));
    media.dispatchEvent(new Event('stalled'));
    media.dispatchEvent(new Event('timeupdate'));
  });
  await page.waitForTimeout(1200);
  await audio.evaluate(element => { delete (element as unknown as { currentTime?: number }).currentTime; });
  await page.waitForTimeout(350);
  await card.getByTestId('pods-audio-play-pause').click();
  await expect.poll(() => Boolean(outcome(fixture.events, 'continuation', 'success')), { timeout: 15000 }).toBe(true);
  const summary = outcome(fixture.events, 'continuation', 'success')!.measurements!;
  expect(summary.stall_count).toBe(1);
  expect(summary.stall_duration_ms).toBeGreaterThanOrEqual(1000);
  expect(summary.observed_playback_ms).toBeGreaterThanOrEqual(Number(summary.stall_duration_ms));
});

test('leaving Pods preserves measured global-audio handoff position', async ({ page }) => {
  const fixture = await browserFixture(page);
  await page.goto('/app');
  const card = page.locator('[data-rux-unit="' + podID + '"]');
  await expect(card).toBeVisible();
  const audio = card.locator('audio');
  if (await audio.evaluate(element => (element as HTMLAudioElement).paused)) await card.getByTestId('pods-audio-play-pause').click();
  await expect.poll(() => Boolean(outcome(fixture.events, 'startup', 'success')), { timeout: 15000 }).toBe(true);
  await page.getByRole('link', { name: 'الأخبار', exact: true }).click();
  await expect(page).toHaveURL(/\/news$/);
  await expect.poll(() => Boolean(outcome(fixture.events, 'handoff', 'success')), { timeout: 15000 }).toBe(true);
  expect(outcome(fixture.events, 'handoff', 'success')!.measurements?.position_drift_ms).toBeLessThanOrEqual(2000);
});


test('retry after a failed feed gets a new measured journey and a real committed success', async ({ page }) => {
  const fixture = await browserFixture(page, { podsFeedFailure: true });
  await page.goto('/app');
  await expect.poll(() => Boolean(outcome(fixture.events, 'feed', 'failed')), { timeout: 25000 }).toBe(true);
  fixture.recoverPods();
  await page.getByRole('button', { name: /Try again|Retry|إعادة|حاول/ }).click();
  await expect(page.locator('[data-rux-unit="' + podID + '"]')).toBeVisible();
  await expect.poll(() => Boolean(outcome(fixture.events, 'feed', 'success')), { timeout: 15000 }).toBe(true);
  expect(outcome(fixture.events, 'feed', 'failed')!.journey_id).not.toBe(outcome(fixture.events, 'feed', 'success')!.journey_id);
  expect(fixture.interceptedBusinessRequests()).toBe(fixture.businessRequests());
});
