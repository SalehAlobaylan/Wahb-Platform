import { emitEvent } from '../collector';
import {
  beginArticle,
  beginFeedLoad,
  beginHandoff,
  beginPagination,
  beginPlayback,
} from '../journeys';
import type { EmitInput } from '../collector';

// Replace the collector's emitEvent with a capture (ESM named binding can't be
// spied after import, so mock the module).
jest.mock('../collector', () => ({ emitEvent: jest.fn() }));
const emitMock = emitEvent as jest.MockedFunction<typeof emitEvent>;

beforeEach(() => emitMock.mockClear());

const emitted = () => emitMock.mock.calls.map((c) => c[0] as EmitInput);
function types() {
  return emitted().map((e) => e.event_type);
}

describe('playback journey — exactly-one startup terminal', () => {
  it('attempt → progress emits started once, even with extra progress', () => {
    const j = beginPlayback({ surface: 'foryou', contentId: 'c1', playbackType: 'hls' });
    j.onProgress();
    j.onProgress(); // no second terminal
    expect(types()).toEqual(['playback_attempted', 'playback_started']);
    const started = emitted().find((e) => e.event_type === 'playback_started')!;
    expect(started.measurements?.visible).toBe(true);
    expect(typeof started.measurements?.duration_ms).toBe('number');
  });

  it('classifies autoplay rejection as autoplay_blocked, not a fatal media error', () => {
    const j = beginPlayback({ surface: 'foryou' });
    j.onPlayReject({ name: 'NotAllowedError' });
    const failed = emitted().find((e) => e.event_type === 'playback_failed')!;
    expect(failed.measurements?.failure_class).toBe('autoplay_blocked');
  });

  it('classifies a non-autoplay rejection as media_error', () => {
    const j = beginPlayback({ surface: 'foryou' });
    j.onPlayReject({ name: 'AbortError' });
    const failed = emitted().find((e) => e.event_type === 'playback_failed')!;
    expect(failed.measurements?.failure_class).toBe('media_error');
  });

  it('media error carries the element error code', () => {
    const j = beginPlayback({ surface: 'foryou', playbackType: 'mp4' });
    j.onMediaError(4);
    const failed = emitted().find((e) => e.event_type === 'playback_failed')!;
    expect(failed.measurements?.media_error_code).toBe(4);
    expect(failed.measurements?.failure_class).toBe('media_error');
  });

  it('does not re-emit a terminal after a media error', () => {
    const j = beginPlayback({ surface: 'foryou' });
    j.onMediaError(2);
    j.onProgress(); // must not emit started
    j.onPlayReject({ name: 'NotAllowedError' }); // must not emit another failed
    expect(types().filter((t) => t.startsWith('playback_') && t !== 'playback_attempted')).toEqual(['playback_failed']);
  });

  it('emits stall + resume as post-start diagnostics', () => {
    const j = beginPlayback({ surface: 'foryou' });
    j.onProgress(); // started
    j.onWaiting(); // stall
    j.onProgress(); // resume
    expect(types()).toEqual(['playback_attempted', 'playback_started', 'playback_waiting', 'playback_resumed']);
  });
});

describe('playback journey — hidden-tab whole-journey exclusion', () => {
  it('emits backgrounded (not started) when hidden during startup', () => {
    const j = beginPlayback({ surface: 'foryou' });
    j.onHidden();
    j.onProgress(); // must not turn into a success
    expect(types()).toEqual(['playback_attempted', 'playback_backgrounded']);
  });
});

describe('feed / pagination / handoff / article journeys settle once', () => {
  it('feed load rendered fires once', () => {
    const j = beginFeedLoad('foryou');
    j.rendered();
    j.empty(); // ignored
    j.failed(); // ignored
    expect(types()).toEqual(['feed_requested', 'feed_rendered']);
  });

  it('pagination starved fires once', () => {
    const j = beginPagination('foryou');
    j.starved();
    j.received();
    expect(types()).toEqual(['pagination_requested', 'pagination_starved']);
  });

  it('handoff completed fires once', () => {
    const j = beginHandoff('foryou', 'c1');
    j.completed();
    j.failed();
    expect(types()).toEqual(['handoff_started', 'handoff_completed']);
  });

  it('article ready fires once', () => {
    const j = beginArticle('s1', 'c1');
    j.ready();
    j.ready();
    expect(types()).toEqual(['article_opened', 'article_ready']);
  });
});
