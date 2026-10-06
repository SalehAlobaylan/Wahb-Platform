import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/lib/test-utils';
import { PodsCard } from '@/components/feed/pods-card';
import { useFeedStore } from '@/lib/stores';
import type { ContentItem } from '@/types';

jest.mock('@/lib/hooks', () => ({
    useTranscript: jest.fn(),
    useRequestTranscription: jest.fn(),
    useTrackingMutation: jest.fn(),
	usePlaybackPreferences: jest.fn(),
}));

import { usePlaybackPreferences, useRequestTranscription, useTrackingMutation, useTranscript } from '@/lib/hooks';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('@/lib/stores/auth-store', () => ({
    useAuthStore: jest.fn(),
}));

const mockUseTranscript = useTranscript as jest.Mock;
const mockUseRequestTranscription = useRequestTranscription as jest.Mock;
const mockUseTrackingMutation = useTrackingMutation as jest.Mock;
const mockUsePlaybackPreferences = usePlaybackPreferences as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const mockItem: ContentItem = {
    id: 'test-1',
    type: 'VIDEO',
    title: 'Test Video Title',
    author: 'Test Author',
    source_name: 'Test Source',
    media_url: 'http://example.com/video.mp4',
    thumbnail_url: 'http://example.com/thumb.jpg',
    duration_sec: 120,
    like_count: 10,
    comment_count: 5,
    share_count: 2,
    transcript_id: 'transcript-1',
    published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    is_liked: false,
    is_bookmarked: false,
};

describe('PodsCard', () => {
    const mutate = jest.fn();
    const trackingMutate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useFeedStore.setState({
            isPlaying: true,
            globalPaused: false,
            playbackSpeed: 1,
            progress: 0,
            podsDisplayMode: 'fit',
            podsAudioDisplayMode: 'transcript',
            podsPlaybackById: {},
        });
        mockUseAuthStore.mockReturnValue({ isAuthenticated: false });
        mockUseTranscript.mockReturnValue({ data: null, isLoading: false, error: null });
        mockUseRequestTranscription.mockReturnValue({
            mutate,
            isPending: false,
            isSuccess: false,
            isError: false,
            error: null,
        });
        trackingMutate.mockReset();
        mockUseTrackingMutation.mockReturnValue({ mutate: trackingMutate });
		mockUsePlaybackPreferences.mockReturnValue({ data: undefined });
    });

    it('renders video in fit mode by default', () => {
        const { container } = renderWithProviders(<PodsCard item={mockItem} isActive />);

        expect(screen.getByText('Test Video Title')).toBeInTheDocument();
        expect(screen.getByText('Test Source')).toBeInTheDocument();
        expect(container.querySelector('video')).toHaveClass('object-contain');
    });

    it('shows the audio scene for a corrected legacy podcast in an MP4 container', () => {
        const { container } = renderWithProviders(<PodsCard item={{
            ...mockItem, type: 'PODCAST', title: 'التجسس الإسرائيلي على أمريكا',
            has_video: false, playback_type: 'mp4', playback_url: mockItem.media_url,
            media_renditions: [{ type: 'mp4', url: mockItem.media_url!, is_primary: true, has_video: false }],
        }} isActive />);
        expect(container.querySelector('video')).toBeNull();
        expect(container.querySelector('audio')).toHaveAttribute('src', mockItem.media_url);
        expect(screen.getByTestId('pods-audio-foreground')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Fit Video' })).not.toBeInTheDocument();
    });

    it('opens metadata from the floating rail and seeks the existing audio owner while paused', () => {
        useFeedStore.setState({ isPlaying: false, globalPaused: true });
        const about = jest.fn();
        const timeRef = { current: 0 };
        const { container } = renderWithProviders(<PodsCard item={{
            ...mockItem, type: 'PODCAST', has_video: false, playback_type: 'mp4',
            playback_url: mockItem.media_url, duration_sec: 298, parent_id: 'parent',
            chapter_start_ms: 1300000, chapter_end_ms: 1598000,
        }} isActive videoTimeRef={timeRef} onOpenAbout={about} />);
        const audio = container.querySelector('audio')!;
        Object.defineProperty(audio, 'currentTime', { writable: true, configurable: true, value: 10 });
        Object.defineProperty(audio, 'duration', { configurable: true, value: 298 });
        fireEvent.timeUpdate(audio);
        expect(screen.getByTestId('pods-audio-foreground')).toHaveTextContent(mockItem.title!);
        fireEvent.click(screen.getByRole('button', { name: 'About' }));
        expect(about).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Skip forward 15 seconds' }));
        expect(audio.currentTime).toBe(25);
        expect(timeRef.current).toBe(25);
        expect(useFeedStore.getState().podsPlaybackById[mockItem.id].timeSec).toBe(25);
        expect(useFeedStore.getState().isPlaying).toBe(false);
        fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
        expect(container.querySelector('audio')).toBe(audio);
        expect(audio.currentTime).toBe(25);
        expect(useFeedStore.getState().globalPaused).toBe(true);
    });

    it.each(['fit', 'fill'] as const)('plays video rather than audio in %s mode despite the audio preference', (mode) => {
        useFeedStore.setState({ podsDisplayMode: mode });
        mockUsePlaybackPreferences.mockReturnValue({ data: { prefer_audio_when_available: true } });
        const { container } = renderWithProviders(<PodsCard item={{
            ...mockItem, has_video: true, playback_type: 'mp4', playback_url: mockItem.media_url,
            media_renditions: [{ type: 'audio', url: 'https://cdn.test/audio.m4a' }],
        }} isActive />);
        expect(container.querySelector('video')).toHaveAttribute('src', mockItem.media_url);
        expect(container.querySelector('audio')).toBeNull();
    });

    it('renders an audio element and transcript/artwork when video fails over to audio', () => {
        const { container } = renderWithProviders(<PodsCard item={{
            ...mockItem, has_video: true, playback_type: 'mp4', playback_url: mockItem.media_url,
            media_renditions: [{ type: 'audio', url: 'https://cdn.test/audio.m4a' }],
        }} isActive />);
        fireEvent.error(container.querySelector('video')!);
        expect(container.querySelector('video')).toBeNull();
        expect(container.querySelector('audio')).toHaveAttribute('src', 'https://cdn.test/audio.m4a');
    });

    it('renders video in fill mode when selected', () => {
        useFeedStore.setState({ podsDisplayMode: 'fill' });

        const { container } = renderWithProviders(<PodsCard item={mockItem} isActive />);

        expect(container.querySelector('video')).toHaveClass('object-cover');
    });

    it('renders timestamped transcript as a live-caption surface while keeping the video mounted', () => {
        useFeedStore.setState({ podsDisplayMode: 'transcript' });
        mockUseTranscript.mockReturnValue({
            data: {
                id: 'transcript-1',
                content_item_id: 'test-1',
                full_text: 'This is the full transcript.',
                language: 'en',
                word_timestamps: [
                    { start: 0, end: 2, text: 'First caption line.' },
                    { start: 2, end: 5, text: 'Second caption line.' },
                ],
                created_at: '2026-01-01T00:00:00Z',
            },
            isLoading: false,
            error: null,
        });

        const { container } = renderWithProviders(<PodsCard item={mockItem} isActive />);

        expect(screen.getByTestId('transcript-surface')).toBeInTheDocument();
        expect(screen.getByText('Live Transcript')).toBeInTheDocument();
        expect(screen.getByText('Auto-generated captions')).toBeInTheDocument();
        expect(screen.getByText('First caption line.')).toBeInTheDocument();
        expect(screen.getByText('0:00')).toBeInTheDocument();
        expect(container.querySelector('video')).toBeInTheDocument();
        expect(container.querySelector('video')).toHaveClass('opacity-0');
    });

    it('updates the active caption segment from video time updates', () => {
        useFeedStore.setState({ podsDisplayMode: 'transcript' });
        mockUseTranscript.mockReturnValue({
            data: {
                id: 'transcript-1',
                content_item_id: 'test-1',
                full_text: 'This is the full transcript.',
                language: 'en',
                word_timestamps: [
                    { start: 0, end: 2, text: 'Opening caption.' },
                    { start: 2, end: 5, text: 'Current caption.' },
                    { start: 5, end: 8, text: 'Later caption.' },
                ],
                created_at: '2026-01-01T00:00:00Z',
            },
            isLoading: false,
            error: null,
        });

        const { container } = renderWithProviders(<PodsCard item={mockItem} isActive />);
        const video = container.querySelector('video')!;

        Object.defineProperty(video, 'currentTime', { configurable: true, value: 3 });
        Object.defineProperty(video, 'duration', { configurable: true, value: 8 });
        fireEvent.timeUpdate(video);

        expect(screen.getByTestId('active-transcript-segment')).toHaveTextContent('Current caption.');
        expect(screen.getByTestId('active-transcript-segment')).toHaveTextContent('0:02');
    });

    it('falls back to reader mode when transcript has no timestamped segments', () => {
        useFeedStore.setState({ podsDisplayMode: 'transcript' });
        mockUseTranscript.mockReturnValue({
            data: {
                id: 'transcript-1',
                content_item_id: 'test-1',
                full_text: 'Plain full transcript without timestamps.',
                language: 'en',
                created_at: '2026-01-01T00:00:00Z',
            },
            isLoading: false,
            error: null,
        });

        renderWithProviders(<PodsCard item={mockItem} isActive />);

        expect(screen.getByTestId('transcript-reader')).toBeInTheDocument();
        expect(screen.getByText('Plain full transcript without timestamps.')).toBeInTheDocument();
    });

    it('renders a safe no-transcript state', () => {
        useFeedStore.setState({ podsDisplayMode: 'transcript' });
        const itemWithoutTranscript: ContentItem = {
            ...mockItem,
            transcript_id: undefined,
            body_text: undefined,
            excerpt: undefined,
        };

        renderWithProviders(<PodsCard item={itemWithoutTranscript} isActive />);

        expect(screen.getByText('No transcript available')).toBeInTheDocument();
        expect(screen.getByText('Sign in to generate a transcript')).toBeInTheDocument();
    });

    it('can trigger transcript generation from the empty state', () => {
        useFeedStore.setState({ podsDisplayMode: 'transcript' });
        mockUseAuthStore.mockReturnValue({ isAuthenticated: true });
        const itemWithoutTranscript: ContentItem = {
            ...mockItem,
            transcript_id: undefined,
            body_text: undefined,
            excerpt: undefined,
        };

        renderWithProviders(<PodsCard item={itemWithoutTranscript} isActive />);
        fireEvent.click(screen.getByRole('button', { name: 'Generate Transcript' }));

        expect(mutate).toHaveBeenCalledWith('test-1');
    });

    it('renders a complete local audio scene without calling descriptions transcripts', () => {
        const audioOnlyItem: ContentItem = {
            ...mockItem,
            id: 'audio-1',
            type: 'PODCAST',
            media_url: undefined,
            playback_url: 'http://example.com/audio.mp3',
            playback_type: 'audio',
            has_video: false,
            transcript_id: undefined,
            body_text: 'Audio transcript fallback text.',
        };

        renderWithProviders(<PodsCard item={audioOnlyItem} isActive />);

        expect(screen.getByTestId('pods-audio-scene')).toBeInTheDocument();
        expect(screen.queryByTestId('transcript-reader')).not.toBeInTheDocument();
        expect(screen.queryByText('Audio transcript fallback text.')).not.toBeInTheDocument();
        expect(document.querySelector('audio')).toHaveAttribute('src', 'http://example.com/audio.mp3');
    });
    it('keeps the same player, position, and video preference while audio captions toggle', () => {
        const item = { ...mockItem, has_video: false, playback_type: 'audio', playback_url: 'https://cdn.test/audio.m4a', media_url: undefined };
        const { container } = renderWithProviders(<PodsCard item={item} isActive />);
        const audio = container.querySelector('audio')!;
        audio.currentTime = 43;
        fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
        expect(container.querySelector('audio')).toBe(audio);
        expect(audio.currentTime).toBe(43);
        expect(useFeedStore.getState().podsDisplayMode).toBe('fit');
        expect(useFeedStore.getState().podsAudioDisplayMode).toBe('listen');
        fireEvent.click(screen.getByRole('button', { name: 'Transcript' }));
        expect(container.querySelector('audio')).toBe(audio);
        expect(audio.currentTime).toBe(43);
    });
    it('preserves position and rate when video falls back to an approved audio rendition', () => {
        useFeedStore.setState({ playbackSpeed: 1.5 });
        const { container } = renderWithProviders(<PodsCard item={{
            ...mockItem, has_video: true, playback_url: mockItem.media_url, playback_type: 'mp4',
            media_renditions: [{ type: 'audio', has_video: false, url: 'https://cdn.test/audio.m4a' }],
        }} isActive />);
        const video = container.querySelector('video')!;
        video.currentTime = 42;
        fireEvent.error(video);
        const audio = container.querySelector('audio')!;
        expect(audio.currentTime).toBe(42);
        expect(audio.playbackRate).toBe(1.5);
        fireEvent.loadedMetadata(audio);
        expect(audio.currentTime).toBe(42);
    });
    it('changes audio speed without pausing, playing again, or replacing the media owner', () => {
        const { container } = renderWithProviders(<PodsCard item={{ ...mockItem, has_video: false, playback_type: 'audio' }} isActive />);
        const audio = container.querySelector('audio')!;
        const pause = jest.spyOn(audio, 'pause');
        const play = jest.spyOn(audio, 'play');
        audio.currentTime = 37;
        pause.mockClear(); play.mockClear();
        act(() => useFeedStore.getState().setPlaybackSpeed(1.75));
        expect(audio.playbackRate).toBe(1.75);
        expect(audio.currentTime).toBe(37);
        expect(container.querySelector('audio')).toBe(audio);
        expect(pause).not.toHaveBeenCalled();
        expect(play).not.toHaveBeenCalled();
    });
    it('keeps blank audio background areas tappable in Transcript mode', () => {
        const { container } = renderWithProviders(<PodsCard item={{ ...mockItem, has_video: false, playback_type: 'audio' }} isActive />);
        const background = container.querySelector('.cursor-pointer.z-\\[1\\]')!;
        expect(background).not.toHaveClass('pointer-events-none');
        fireEvent.click(background);
        expect(useFeedStore.getState().isPlaying).toBe(false);
    });
    it('uses child-owned segment timestamps without subtracting the parent offset', () => {
        mockUseTranscript.mockReturnValue({ data: {
            id: 'transcript-1', content_item_id: 'test-1', full_text: 'Child phrase.',
            segments: [{ text: 'Child phrase.', start: 1, end: 4 }], word_timestamps: [],
        }, isLoading: false, error: null });
        const { container } = renderWithProviders(<PodsCard item={{ ...mockItem, has_video: false, playback_type: 'audio', chapter_start_ms: 900000 }} isActive />);
        const audio = container.querySelector('audio')!;
        audio.currentTime = 2;
        fireEvent.timeUpdate(audio);
        expect(screen.getByTestId('pods-audio-active-cue')).toHaveTextContent('Child phrase.');
        audio.currentTime = 5;
        fireEvent.timeUpdate(audio);
        expect(screen.queryByTestId('pods-audio-active-cue')).toBeNull();
    });
    it('does not render a transcript owned by a different item', () => {
        mockUseTranscript.mockReturnValue({ data: { content_item_id: 'other-item', full_text: 'Wrong episode.', segments: [{ start: 0, end: 10, text: 'Wrong episode.' }] }, isLoading: false, error: null });
        renderWithProviders(<PodsCard item={{ ...mockItem, has_video: false, playback_type: 'audio' }} isActive />);
        expect(screen.queryByText('Wrong episode.')).toBeNull();
    });
    it('provides a keyboard-scrollable reader, traps focus, and restores the opener on close', () => {
        mockUseTranscript.mockReturnValue({ data: { content_item_id: mockItem.id, full_text: 'A full readable transcript.' }, isLoading: false, error: null });
        renderWithProviders(<PodsCard item={{ ...mockItem, has_video: false, playback_type: 'audio' }} isActive />);
        const opener = screen.getByRole('button', { name: 'Open full transcript' });
        opener.focus();
        fireEvent.click(opener);
        const close = screen.getByRole('button', { name: 'Close' });
        const reader = screen.getByRole('region', { name: 'Transcript' });
        expect(reader).toHaveAttribute('tabindex', '0');
        expect(close).toHaveFocus();
        reader.focus();
        fireEvent.keyDown(reader, { key: 'Tab' });
        expect(close).toHaveFocus();
        fireEvent.keyDown(close, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(opener).toHaveFocus();
    });
    it('stops decorative work under sheets, on hidden documents, and on inactive cards', () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        const item = { ...mockItem, has_video: false, playback_type: 'audio' };
        const view = renderWithProviders(<PodsCard item={item} isActive />);
        const audio = view.container.querySelector('audio')!;
        Object.defineProperties(audio, {
            paused: { configurable: true, value: false },
            readyState: { configurable: true, value: 4 },
        });
        fireEvent.playing(audio);
        expect(screen.getByTestId('pods-audio-scene')).toHaveAttribute('data-motion', 'ambient');
        view.rerender(<PodsCard item={item} isActive sceneCovered />);
        expect(screen.getByTestId('pods-audio-scene')).toHaveAttribute('data-motion', 'static');
        expect(view.container.querySelector('audio')).toBe(audio);
        view.rerender(<PodsCard item={item} isActive />);
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        fireEvent(document, new Event('visibilitychange'));
        expect(screen.getByTestId('pods-audio-scene')).toHaveAttribute('data-motion', 'static');
        view.rerender(<PodsCard item={item} isActive={false} />);
        expect(screen.getByTestId('pods-audio-scene')).toHaveAttribute('data-motion', 'static');
        Reflect.deleteProperty(document, 'visibilityState');
    });

    it('renders atomized playback_url-only video chapters', () => {
        const chapterItem: ContentItem = {
            ...mockItem,
            id: 'chapter-1',
            media_url: undefined,
            playback_url: 'http://example.com/chapter.m3u8',
            playback_type: 'hls',
            fallback_playback_url: 'http://example.com/chapter.mp4',
            has_video: true,
            parent_id: 'parent-1',
            chapter_index: 0,
        };

        const { container } = renderWithProviders(<PodsCard item={chapterItem} isActive />);

        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
        // JSDOM has no native HLS capability, so the card must select CMS's
        // declared MP4 fallback instead of assigning an unsupported manifest.
        expect(video).toHaveAttribute('src', 'http://example.com/chapter.mp4');
    });

    it('advances once to the next approved playback candidate after a media error', () => {
        const fallbackItem: ContentItem = {
            ...mockItem,
            playback_url: 'http://example.com/primary.mp4',
            playback_type: 'mp4',
            fallback_playback_url: 'http://example.com/fallback.mp4',
        };
        const { container } = renderWithProviders(<PodsCard item={fallbackItem} isActive />);
        const video = container.querySelector('video')!;

        expect(video).toHaveAttribute('src', 'http://example.com/primary.mp4');
        fireEvent.error(video);

        expect(container.querySelector('video')).toHaveAttribute('src', 'http://example.com/fallback.mp4');
    });

    it('requires an explicit replay after natural end and counts each playback run once', () => {
        const { container } = renderWithProviders(<PodsCard item={mockItem} isActive />);
        const video = container.querySelector('video')!;
        Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 120 });
        Object.defineProperty(video, 'duration', { configurable: true, value: 120 });

        fireEvent.ended(video);
        fireEvent.ended(video);
        expect(trackingMutate).toHaveBeenCalledTimes(1);

        fireEvent.click(video);
        expect(video.currentTime).toBe(0);
        fireEvent.ended(video);
        expect(trackingMutate).toHaveBeenCalledTimes(2);
    });

    it('does not fetch transcript content for inactive offscreen cards', () => {
        useFeedStore.setState({ podsDisplayMode: 'transcript' });

        renderWithProviders(<PodsCard item={mockItem} isActive={false} />);

        expect(mockUseTranscript).not.toHaveBeenCalled();
        expect(screen.queryByText('Transcript')).not.toBeInTheDocument();
    });
});
