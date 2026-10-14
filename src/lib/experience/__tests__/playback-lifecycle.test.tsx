import { act, renderHook } from '@testing-library/react';
import { usePlaybackTelemetry } from '../use-playback-telemetry';
import { emitEvent } from '../collector';
jest.mock('../collector', () => ({ emitEvent: jest.fn() }));
const mockEmit = emitEvent as jest.Mock;

beforeEach(() => { jest.useFakeTimers(); mockEmit.mockClear(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
const terminals = () => mockEmit.mock.calls.map(call => call[0]).filter(event => event.event_type === 'journey_terminal' && event.phase === 'startup');

it('ref attachment and a queued pause cannot cancel resumed playback', () => {
  const element = document.createElement('audio');
  let paused = true;
  Object.defineProperty(element, 'paused', { get: () => paused });
  const hook = renderHook(({ mediaElement }) => usePlaybackTelemetry({ mediaElement }), {
    initialProps: { mediaElement: null as HTMLMediaElement | null },
  });
  act(() => hook.result.current.notifyAttempt());
  hook.rerender({ mediaElement: element });
  act(() => {
    paused = false;
    element.dispatchEvent(new Event('pause'));
    element.currentTime = .2;
    element.dispatchEvent(new Event('timeupdate'));
  });
  expect(terminals().map(event => event.outcome)).toEqual(['success']);
  hook.unmount();
});

it('a different content owner cancels the old pending attempt', () => {
  const element = document.createElement('audio');
  const hook = renderHook(({ contentId }) => usePlaybackTelemetry({ mediaElement: element, contentId }), {
    initialProps: { contentId: 'one' },
  });
  act(() => hook.result.current.notifyAttempt());
  hook.rerender({ contentId: 'two' });
  expect(terminals().map(event => event.outcome)).toEqual(['cancelled']);
  act(() => hook.result.current.notifyAttempt());
  act(() => jest.advanceTimersByTime(10_000));
  expect(terminals().map(event => event.outcome)).toEqual(['cancelled', 'timeout']);
  hook.unmount();
});

it('timeupdate before seeked cannot settle startup from an intentional seek', () => {
  const element = document.createElement('audio');
  Object.defineProperty(element, 'paused', { get: () => false });
  const hook = renderHook(() => usePlaybackTelemetry({ mediaElement: element }));
  act(() => hook.result.current.notifyAttempt());
  act(() => {
    element.dispatchEvent(new Event('seeking'));
    element.currentTime = 100;
    element.dispatchEvent(new Event('timeupdate'));
  });
  expect(terminals()).toHaveLength(0);
  act(() => {
    element.dispatchEvent(new Event('seeked'));
    element.currentTime = 100.25;
    element.dispatchEvent(new Event('timeupdate'));
  });
  expect(terminals().map(event => event.outcome)).toEqual(['success']);
  hook.unmount();
});
