'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Loader2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import styles from './audio-foreground.module.css';

export function audioTime(seconds: number) {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

/** Controls decorate the card's media element; they never create a player. */
export function AudioPlayerControls({ position, duration, playing, buffering, disabled, rate, onToggle, onSeek, onRate }: {
    position: number; duration: number; playing: boolean; buffering: boolean; disabled: boolean;
    rate: number; onToggle: () => void; onSeek: (seconds: number) => void; onRate: () => void;
}) {
    const t = useTranslations();
    const [scrub, setScrub] = useState<number | null>(null);
    const dragging = useRef(false);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const time = Math.min(safeDuration, Math.max(0, scrub ?? position));
    const canSeek = !disabled && safeDuration > 0;
    return <div className={styles.player} data-testid="pods-audio-player" onClick={(event) => event.stopPropagation()}>
        <div className={styles.timeline} dir="ltr">
            <input type="range" min={0} max={safeDuration || 1} step={0.1}
                aria-label={t('pods.audio.scrubber')} aria-valuetext={`${audioTime(time)} / ${audioTime(safeDuration)}`}
                disabled={!canSeek} value={time}
                style={{ '--progress': `${safeDuration > 0 ? time / safeDuration * 100 : 0}%` } as CSSProperties}
                onPointerDown={() => { dragging.current = true; setScrub(position); }}
                onChange={(event) => {
                    const next = Number(event.target.value);
                    if (dragging.current) setScrub(next);
                    else onSeek(next);
                }}
                onPointerUp={(event) => { if (dragging.current) onSeek(Number(event.currentTarget.value)); dragging.current = false; setScrub(null); }}
                onPointerCancel={() => { dragging.current = false; setScrub(null); }} onBlur={() => { dragging.current = false; setScrub(null); }}
            />
            <div className={styles.times}><span>{audioTime(time)}</span><span>−{audioTime(safeDuration - time)}</span></div>
        </div>
        <div className={styles.transport} dir="ltr">
            <button type="button" className={styles.speed} onClick={onRate} aria-label={t('pods.audio.speed', { rate })}>{rate}×</button>
            <button type="button" className={styles.skip} disabled={!canSeek} aria-label={t('nowPlaying.skipBack')} onClick={() => onSeek(position - 15)}>
                <RotateCcw aria-hidden="true" size={24} /><span aria-hidden="true">15</span>
            </button>
            <button type="button" data-testid="pods-audio-play-pause" className={styles.play} disabled={disabled}
                aria-label={t(playing ? 'nowPlaying.pause' : 'nowPlaying.play')} onClick={onToggle}>
                {buffering ? <Loader2 className="animate-spin" aria-hidden="true" size={20} /> : playing ? <Pause aria-hidden="true" size={20} fill="currentColor" /> : <Play aria-hidden="true" size={20} fill="currentColor" />}
            </button>
            <button type="button" className={styles.skip} disabled={!canSeek} aria-label={t('nowPlaying.skipForward')} onClick={() => onSeek(position + 15)}>
                <RotateCw aria-hidden="true" size={24} /><span aria-hidden="true">15</span>
            </button>
        </div>
    </div>;
}
