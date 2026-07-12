'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { emitEvent, initCollector } from '@/lib/experience/collector';
import { reportClientFailure } from '@/lib/experience/journeys';
import { surfaceForPath } from '@/lib/experience/surface';

/**
 * Mounts the RUX collector once per page load: initializes delivery, emits a
 * single session_started, and installs sanitized global error observers.
 * Renders nothing and never blocks the tree — telemetry is fire-and-forget.
 */
export function ExperienceProvider() {
  const pathname = usePathname();
  const booted = useRef(false);
  const visitedSurfaces = useRef(new Set<string>());

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    initCollector();
    // Sanitized global error capture — NO message/stack text leaves the browser.
    const onError = () => {
      const surface = surfaceForPath(window.location.pathname);
      if (surface) reportClientFailure(surface, 'unknown');
    };
    const onRejection = () => {
      const surface = surfaceForPath(window.location.pathname);
      if (surface) reportClientFailure(surface, 'unknown');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
    // Intentionally run once on mount; pathname is read live in handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const surface = surfaceForPath(pathname);
    if (!surface || visitedSurfaces.current.has(surface)) return;
    visitedSurfaces.current.add(surface);
    emitEvent({ event_type: 'session_started', surface });
  }, [pathname]);

  return null;
}
