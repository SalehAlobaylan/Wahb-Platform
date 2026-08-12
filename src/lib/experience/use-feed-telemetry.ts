'use client';

import { useEffect, useRef } from 'react';
import { beginFeedLoad, beginPagination, type FeedLoadJourney, type PaginationJourney } from './journeys';
import type { RuxSurface } from './types';

type QueryStatus = 'pending' | 'success' | 'error';

interface FeedLoadTelemetryInput {
  surface: RuxSurface;
  status: QueryStatus;
  unitCount: number;
  // One exact server-returned item proves a concrete render boundary. It is
  // evidence only and never becomes ranking/session state.
  renderedContentID?: string;
  // Distinguishes a fresh load from a refetch, so a new load re-arms the journey.
  loadKey?: string | number;
}

/**
 * Observes a TanStack Query feed result and emits the feed-load journey's
 * terminal event exactly once per load: feed_rendered (units present),
 * feed_empty (successful but zero units), or feed_failed (error). The journey
 * begins on mount / whenever loadKey changes (a new fresh load).
 */
export function useFeedLoadTelemetry({ surface, status, unitCount, renderedContentID, loadKey }: FeedLoadTelemetryInput): void {
  const journeyRef = useRef<FeedLoadJourney | null>(null);
  const settledRef = useRef(false);
  const lastKeyRef = useRef<string | number | undefined>(undefined);

  // Arm a fresh journey on mount or when the load key changes (e.g. duration
  // filter switch triggers a new request).
  useEffect(() => {
    if (lastKeyRef.current !== loadKey) {
      lastKeyRef.current = loadKey;
      journeyRef.current = beginFeedLoad(surface);
      settledRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  useEffect(() => {
    if (settledRef.current || !journeyRef.current) return;
    if (status === 'success') {
      settledRef.current = true;
      if (unitCount > 0) journeyRef.current.rendered(renderedContentID);
      else journeyRef.current.empty();
    } else if (status === 'error') {
      settledRef.current = true;
      journeyRef.current.failed('unknown');
    }
  }, [status, unitCount, renderedContentID]);
}

/**
 * Emits a pagination journey when the user approaches the loaded-feed boundary.
 * Call `armPagination()` when a next-page fetch begins; call the returned
 * handle's received()/starved() as the outcome resolves.
 */
export function usePaginationTelemetry(surface: RuxSurface) {
  const journeyRef = useRef<PaginationJourney | null>(null);

  const arm = () => {
    if (journeyRef.current) return; // one in flight at a time
    journeyRef.current = beginPagination(surface);
  };
  const received = () => {
    journeyRef.current?.received();
    journeyRef.current = null;
  };
  const starved = () => {
    journeyRef.current?.starved();
    journeyRef.current = null;
  };
  return { arm, received, starved };
}
