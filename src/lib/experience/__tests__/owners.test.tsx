import { act, renderHook } from '@testing-library/react';
import { usePlaybackTelemetry } from '../use-playback-telemetry';
import { newlyUsableUnits, useFeedLoadTelemetry } from '../use-feed-telemetry';
import { emitEvent } from '../collector';
jest.mock('../collector', () => ({ emitEvent: jest.fn() }));
const mockEmit = emitEvent as jest.Mock;
const terminals = (phase: string) => mockEmit.mock.calls.map(call => call[0]).filter(event => event.event_type === 'journey_terminal' && event.phase === phase);
let paused = true;
let visibility = 'visible';
function media() { const element = document.createElement('audio'); Object.defineProperty(element, 'paused', { configurable: true, get: () => paused }); return element; }
beforeEach(() => { jest.useFakeTimers(); mockEmit.mockClear(); paused = true; visibility = 'visible'; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility }); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
it('playing without advancing media clock cannot succeed', () => { const element = media(); const hook = renderHook(() => usePlaybackTelemetry({ mediaElement: element })); act(() => { hook.result.current.notifyAttempt(); paused = false; element.dispatchEvent(new Event('playing')); }); expect(terminals('startup')).toHaveLength(0); act(() => jest.advanceTimersByTime(10000)); expect(terminals('startup')[0].outcome).toBe('timeout'); hook.unmount(); });
it('actual progress settles startup once and pause closes listening', () => { const element = media(); const hook = renderHook(() => usePlaybackTelemetry({ mediaElement: element })); act(() => { hook.result.current.notifyAttempt(); paused = false; element.currentTime = .2; element.dispatchEvent(new Event('timeupdate')); element.dispatchEvent(new Event('timeupdate')); }); expect(terminals('startup')).toHaveLength(1); act(() => { jest.advanceTimersByTime(1000); paused = true; element.dispatchEvent(new Event('pause')); }); expect(terminals('continuation')[0].outcome).toBe('success'); hook.unmount(); });
it('deactivation cancels an unstarted card', () => { const element = media(); const hook = renderHook(({ active }) => usePlaybackTelemetry({ mediaElement: element, active }), { initialProps: { active: true } }); act(() => hook.result.current.notifyAttempt()); hook.rerender({ active: false }); expect(terminals('startup')[0].outcome).toBe('cancelled'); hook.unmount(); });
it('fallback source replacement preserves the user attempt', () => { const element = media(); const hook = renderHook(() => usePlaybackTelemetry({ mediaElement: element, canFallback: true })); act(() => { hook.result.current.notifyAttempt(); element.dispatchEvent(new Event('error')); hook.result.current.notifyFallback('mp4'); element.dispatchEvent(new Event('pause')); paused = false; element.currentTime = .2; element.dispatchEvent(new Event('timeupdate')); }); expect(terminals('startup')).toHaveLength(1); expect(terminals('startup')[0].outcome).toBe('success'); expect(terminals('fallback')[0].outcome).toBe('success'); hook.unmount(); });
it('visible ongoing play resumes continuation after background without a new startup', () => { const element = media(); const hook = renderHook(() => usePlaybackTelemetry({ mediaElement: element })); act(() => { hook.result.current.notifyAttempt(); paused = false; element.currentTime = .2; element.dispatchEvent(new Event('timeupdate')); visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); jest.advanceTimersByTime(1000); paused = true; element.dispatchEvent(new Event('pause')); }); expect(terminals('startup').filter(event => event.outcome === 'success')).toHaveLength(1); expect(terminals('continuation').at(-1).outcome).toBe('success'); hook.unmount(); });
it('sixth-page eviction still recognizes new usable IDs', () => { expect(newlyUsableUnits(['one', 'two', 'three', 'four', 'five'], ['two', 'three', 'four', 'five', 'six'])).toBe(true); expect(newlyUsableUnits(['one', 'two'], ['two', 'one'])).toBe(false); });
it('query success cannot claim a rendered card missing from the committed DOM', () => { const hook = renderHook(() => useFeedLoadTelemetry({ surface: 'pods', status: 'success', unitCount: 1, renderedContentID: 'item', loadKey: 'first' })); act(() => jest.advanceTimersByTime(20)); expect(terminals('feed')).toHaveLength(0); hook.unmount(); expect(terminals('feed')[0].outcome).toBe('cancelled'); });

it('a failed refresh has its own outcome despite an already usable feed', async () => {
  const card = document.createElement('div'); card.dataset.ruxUnit = 'item'; document.body.append(card);
  const hook = renderHook(() => useFeedLoadTelemetry({ surface: 'pods', status: 'success', unitCount: 1, renderedContentID: 'item', loadKey: 'all' }));
  act(() => jest.advanceTimersByTime(20));
  let reject!: (error: Error) => void;
  const operation = new Promise<void>((_, fail) => { reject = fail; });
  let completion!: Promise<void>;
  act(() => { completion = hook.result.current.requested(() => operation).catch(() => undefined); });
  act(() => jest.advanceTimersByTime(20));
  expect(terminals('feed').map(event => event.outcome)).toEqual(['success']);
  await act(async () => { reject(new Error('fixture failure')); await completion; });
  act(() => jest.advanceTimersByTime(20));
  expect(terminals('feed').map(event => event.outcome)).toEqual(['success', 'failed']);
  hook.unmount(); card.remove();
});
it('a refreshed query needs a committed card before proving another successful load', async () => {
  const card = document.createElement('div'); card.dataset.ruxUnit = 'item'; document.body.append(card);
  const hook = renderHook(() => useFeedLoadTelemetry({ surface: 'news', status: 'success', unitCount: 1, renderedContentID: 'item', loadKey: 'all' }));
  act(() => jest.advanceTimersByTime(20));
  card.remove();
  await act(async () => { await hook.result.current.requested(async () => undefined); });
  act(() => jest.advanceTimersByTime(20));
  expect(terminals('feed').map(event => event.outcome)).toEqual(['success']);
  hook.unmount();
});

it('listening after a delayed recovery preserves the original startup timeout', () => {
  const element = media(); const hook = renderHook(() => usePlaybackTelemetry({ mediaElement: element }));
  act(() => hook.result.current.notifyAttempt());
  act(() => jest.advanceTimersByTime(10000));
  act(() => { paused = false; element.currentTime = .25; element.dispatchEvent(new Event('timeupdate')); jest.advanceTimersByTime(1000); paused = true; element.dispatchEvent(new Event('pause')); });
  expect(terminals('startup').map(event => event.outcome)).toEqual(['timeout']);
  expect(terminals('continuation')[0]).toMatchObject({outcome:'success',measurements:{observed_playback_ms:1000}});hook.unmount();
});
