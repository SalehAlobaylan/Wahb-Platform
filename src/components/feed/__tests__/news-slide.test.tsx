import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/lib/test-utils';
import { NewsSlide } from '@/components/feed/news-slide';
import { NewsSlide as NewsSlideType } from '@/types';

const mockOnOpenArticle = jest.fn();

const mockSlide: NewsSlideType = {
    slide_id: 'slide-1',
    featured: {
        id: 'feat-1',
        type: 'ARTICLE',
        title: 'Featured Article Title',
        excerpt: 'Detailed excerpt of the featured article.',
        // Long enough that hasEnoughContent() treats the hero as openable.
        body_text:
            'A longer body so the featured hero is treated as having enough content to open in the reader. '.repeat(3),
        author: 'Main Author',
        source_name: 'Main Source',
        thumbnail_url: 'http://example.com/feat.jpg',
        published_at: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
        like_count: 100,
        comment_count: 50,
        share_count: 20,
        status: 'READY',
    },
    related: [
        {
            id: 'rel-1',
            type: 'TWEET',
            body_text: 'Related Tweet Body',
            author: '@user1',
            published_at: '2026-01-01T00:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
            like_count: 10,
            comment_count: 5,
            share_count: 2,
            status: 'READY',
        },
        {
            id: 'rel-2',
            type: 'COMMENT',
            body_text: 'Related Comment Body',
            author: 'User Two',
            published_at: '2026-01-01T00:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
            like_count: 5,
            comment_count: 1,
            share_count: 0,
            status: 'READY',
        },
        {
            id: 'rel-3',
            type: 'ARTICLE',
            title: 'Related Article Title',
            author: 'Author Three',
            published_at: '2026-01-01T00:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
            like_count: 15,
            comment_count: 3,
            share_count: 1,
            status: 'READY',
        },
    ],
};

describe('NewsSlide', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the featured article title', () => {
        renderWithProviders(
            <NewsSlide slide={mockSlide} isActive onOpenArticle={mockOnOpenArticle} />
        );

        expect(screen.getByText('Featured Article Title')).toBeInTheDocument();
    });

    it('renders the featured source name', () => {
        renderWithProviders(
            <NewsSlide slide={mockSlide} isActive onOpenArticle={mockOnOpenArticle} />
        );

        // The featured byline shows source_name (falling back to author).
        expect(screen.getByText('Main Source')).toBeInTheDocument();
    });

    it('renders the related section heading and a related article title', () => {
        renderWithProviders(
            <NewsSlide slide={mockSlide} isActive onOpenArticle={mockOnOpenArticle} />
        );

        expect(screen.getByText('Related')).toBeInTheDocument();
        expect(screen.getByText('Related Article Title')).toBeInTheDocument();
    });

    it('opens the featured article in the reader when the hero is clicked', () => {
        renderWithProviders(
            <NewsSlide slide={mockSlide} isActive onOpenArticle={mockOnOpenArticle} />
        );

        fireEvent.click(screen.getByText('Featured Article Title'));

        expect(mockOnOpenArticle).toHaveBeenCalledWith(mockSlide.featured);
    });
});
