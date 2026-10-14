import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beginArticle, beginFeedLoad, beginHandoff, beginPagination, beginPlayback } from '../journeys';
import { RUX_OUTCOMES, RUX_PHASES, RUX_SCHEMA_VERSION, type RuxEvent } from '../types';
import { emitEvent } from '../collector';
jest.mock('../collector', () => ({ emitEvent: jest.fn() }));
const fixture = JSON.parse(readFileSync(resolve(process.cwd(), '../fixtures/real-experience-contract.json'), 'utf8')) as {
  schema_version: number; phases: string[]; outcomes: string[];
  cases: { name: string; accepted: boolean; event: RuxEvent }[];
};
let clock = 0;
beforeEach(() => { jest.useFakeTimers(); clock = 0; jest.spyOn(performance, 'now').mockImplementation(() => clock); (emitEvent as jest.Mock).mockClear(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });
it('uses the same schema and terminal enums as the CMS fixture', () => {
  expect(RUX_SCHEMA_VERSION).toBe(fixture.schema_version);
  expect([...RUX_PHASES]).toEqual(fixture.phases);
  expect([...RUX_OUTCOMES]).toEqual(fixture.outcomes);
});
it.each(fixture.cases.filter(example => example.accepted))('emits the shared $name outcome and bounded units', ({ event, name }) => {
  clock = 0;
  if (event.phase === 'feed') {
    const journey = beginFeedLoad('pods'); clock = 1000;
    if (event.outcome === 'success') journey.rendered(); else if (event.outcome === 'empty') journey.empty(); else journey.failed();
  } else if (event.phase === 'reader') { const journey = beginArticle(); clock = 1000; journey.ready(); }
  else if (event.phase === 'pagination') { const journey = beginPagination('pods'); clock = 1000; journey.starved(); journey.received(); }
  else if (event.phase === 'handoff') { const journey = beginHandoff('pods', undefined, 10); clock = 1000; journey.completed(13); }
  else {
    const journey = beginPlayback({ surface: 'pods' });
    if (name === 'automatic play blocked') { clock = 1000; journey.onPlayReject({ name: 'NotAllowedError' }); }
    else if (name === 'cancelled startup') { clock = 1000; journey.cancel(); }
    else if (event.phase === 'fallback') { journey.fallback('audio'); clock = 1000; journey.onProgress(); }
    else if (event.phase === 'continuation') { journey.onProgress(); clock = 1000; journey.onWaiting(); clock = 31000; journey.onProgress(); clock = 60000; journey.finish(); }
    else { clock = 1000; journey.onProgress(); }
  }
  const terminal = (emitEvent as jest.Mock).mock.calls.map(call => call[0]).find(value => value.event_type === 'journey_terminal' && value.phase === event.phase);
  expect(terminal).toMatchObject({ phase: event.phase, outcome: event.outcome, measurements: event.measurements });
});
