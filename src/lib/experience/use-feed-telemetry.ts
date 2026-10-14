'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { beginFeedLoad, beginPagination, type FeedLoadJourney, type PaginationJourney } from './journeys';
import type { RuxSurface } from './types';
interface Input { surface: RuxSurface; status: 'pending' | 'success' | 'error'; unitCount: number; renderedContentID?: string; loadKey?: string | number }
export function useFeedLoadTelemetry({ surface, status, unitCount, renderedContentID, loadKey }: Input) {
  const [revision, setRevision] = useState(0);
  const awaitingRequest = useRef(false);
  const ref = useRef<FeedLoadJourney | null>(null);
  useLayoutEffect(() => { awaitingRequest.current = false; ref.current = beginFeedLoad(surface); return () => { ref.current?.cancel(); ref.current = null; }; }, [surface, loadKey]);
  useEffect(() => {
    if (awaitingRequest.current) return;
    if (status === 'error') { ref.current?.failed('network'); return; }
    if (status !== 'success') return;
    if (!unitCount) { ref.current?.empty(); return; }
    // Only a committed concrete card/slide can prove a usable render. A query
    // success behind a render error boundary does not settle this journey.
    const frame = requestAnimationFrame(() => {
      if (renderedContentID && Array.from(document.querySelectorAll<HTMLElement>('[data-rux-unit]')).some(node => node.dataset.ruxUnit === renderedContentID)) ref.current?.rendered(renderedContentID);
    });
    return () => cancelAnimationFrame(frame);
  }, [status, unitCount, renderedContentID, loadKey, revision]);
  const requested = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    ref.current?.cancel();
    const current = beginFeedLoad(surface); ref.current = current; awaitingRequest.current = true;
    try { return await operation(); }
    catch (error) { current.failed('network'); throw error; }
    finally { if (ref.current === current) { awaitingRequest.current = false; setRevision(value => value + 1); } }
  }, [surface]);
  return { requested };
}
export function newlyUsableUnits(before: readonly string[], after: readonly string[]): boolean { const old = new Set(before); return after.some(id => !old.has(id)); }
export function usePaginationTelemetry(surface: RuxSurface) {
  const ref = useRef<PaginationJourney | null>(null);
  const arm = useCallback(() => { if (!ref.current) ref.current = beginPagination(surface); }, [surface]);
  const received = useCallback(() => { ref.current?.received(); ref.current = null; }, []);
  const starved = useCallback(() => ref.current?.starved(), []);
  const failed = useCallback(() => { ref.current?.failed(); ref.current = null; }, []);
  const end = useCallback(() => { ref.current?.end(); ref.current = null; }, []);
  useEffect(() => () => { ref.current?.cancel(); ref.current = null; }, [surface]);
  return useMemo(() => ({ arm, received, starved, failed, end }), [arm, received, starved, failed, end]);
}
