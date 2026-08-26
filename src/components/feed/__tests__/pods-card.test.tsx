import { fireEvent, screen } from '@testing-library/react';
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

    it('uses transcript-first rendering for audio-only items', () => {
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

        expect(screen.getByTestId('transcript-reader')).toBeInTheDocument();
        expect(screen.getByText('Audio transcript fallback text.')).toBeInTheDocument();
        expect(document.querySelector('audio')).toHaveAttribute('src', 'http://example.com/audio.mp3');
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
