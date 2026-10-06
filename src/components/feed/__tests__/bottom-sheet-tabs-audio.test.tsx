import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/lib/test-utils';
import { BottomSheetTabs } from '@/components/feed/bottom-sheet-tabs';
import { useTranscript } from '@/lib/hooks';

jest.mock('@/lib/hooks', () => ({
    useComments: () => ({ data: null }),
    useTranscript: jest.fn(),
    useRequestTranscription: () => ({ isPending: false, isSuccess: false, isError: false }),
}));
jest.mock('@/lib/stores/auth-store', () => ({ useAuthStore: () => ({ isAuthenticated: false }) }));
const query = useTranscript as jest.Mock;
const renderReader = () => renderWithProviders(<BottomSheetTabs activeTab="transcript" hasTranscript transcriptId="t" contentItemId="child" />);

it('shows available episode metadata and provides an explicit sheet close control', () => {
    const close = jest.fn();
    renderWithProviders(<BottomSheetTabs activeTab="about" title="Episode" author="Publisher" onClose={close} mediaMetadata={{
        source_name: 'Show', duration_sec: 298, published_at: '2026-06-16T03:00:15Z',
        parent_id: 'parent', chapter_start_ms: 1300500, chapter_end_ms: 1598500,
    }} />);
    expect(screen.getByText('Show')).toBeInTheDocument();
    expect(screen.getByText('Publisher')).toBeInTheDocument();
    expect(screen.getByText('4:58')).toBeInTheDocument();
    expect(screen.getByText('21:40–26:38')).toBeInTheDocument();
    expect(screen.getByText('June 16, 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(close).toHaveBeenCalledTimes(1);
});

it('reads provider words with punctuation through the full transcript sheet', () => {
    query.mockReturnValue({ data: { content_item_id: 'child', full_text: 'One. Two.', word_timestamps: [
        { word: 'One', punctuated_word: 'One.', start: 0, end: 1 },
        { word: 'Two', punctuated_word: 'Two.', start: 1, end: 2 },
    ] }, isLoading: false, error: null });
    renderReader();
    expect(screen.getByText('One.')).toBeInTheDocument();
    expect(screen.getByText('Two.')).toBeInTheDocument();
});

it('reads chapter-relative segment-only transcripts', () => {
    query.mockReturnValue({ data: { content_item_id: 'child', full_text: 'النص', segments: [
        { text: 'نص الفصل.', start: 0, end: 3 },
    ], word_timestamps: [] }, isLoading: false, error: null });
    renderReader();
    expect(screen.getByText('نص الفصل.')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
});

it('does not read another episode in the selected transcript sheet', () => {
    query.mockReturnValue({ data: { content_item_id: 'other', full_text: 'Wrong episode.' }, isLoading: false, error: null });
    renderReader();
    expect(screen.queryByText('Wrong episode.')).toBeNull();
    expect(screen.getByText('Could not load transcript')).toBeInTheDocument();
});
