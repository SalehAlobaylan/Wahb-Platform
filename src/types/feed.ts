// Feed API Types

export type ContentType = 'NEWS' | 'ARTICLE' | 'VIDEO' | 'TWEET' | 'COMMENT' | 'PODCAST';
export type SourceType = 'RSS' | 'PODCAST' | 'YOUTUBE' | 'UPLOAD' | 'MANUAL' | 'TELEGRAM';

export interface ContentItem {
  id: string;
  type: ContentType;
  title?: string;
  body_text?: string;
  excerpt?: string;
  media_url?: string;
  thumbnail_url?: string;
  original_url?: string;
  duration_sec?: number;
  author?: string;
  source_name?: string;

  // Interaction/Engagement stats
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count?: number; // Added from schema

  // New fields from CMS schema
  transcript_id?: string;
  topic_tags?: string[];
  source_feed_url?: string;
  metadata?: Record<string, unknown>;
  status?: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';

  published_at: string;
  created_at: string;
  updated_at?: string; // Added from schema

  // User-specific state (joined)
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_archived?: boolean;
}

// Phase 13 — NEWS-first stories feed. A News slide is one featured story (a
// cluster of same-event posts) plus up to 3 related stories. The featured
// headline + image come from the story's highest-engagement member.

export interface StoryMember {
  id: string;
  type: ContentType;
  format?: string;
  title?: string;
  excerpt?: string;
  body_text?: string;
  author?: string;
  source_name?: string;
  thumbnail_url?: string;
  published_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface StorySummary {
  story_id: string;
  // lead_id is the headline member's content id — interactions (open / like /
  // bookmark) target THIS, not story_id (a topic id with no content row).
  lead_id: string;
  label: string;
  title?: string;
  excerpt?: string;
  thumbnail_url?: string;
  source_name?: string;
  published_at: string;
  member_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface StoryFeatured extends StorySummary {
  members: StoryMember[];
}

// Wire types: exactly what GET /feed/news returns. feeds.ts adapts these into
// the editorial NewsSlide shape below, so the News UI is unchanged.
export interface StoryNewsSlide {
  slide_id: string;
  featured: StoryFeatured;
  related: StorySummary[];
}

export interface StoryNewsResponse {
  cursor: string | null;
  slides: StoryNewsSlide[];
}

// Editorial slide shape consumed by the News UI: 1 featured item + related
// items. Built from a StoryNewsSlide (featured = the story's top member; related
// = the story's other members + related-story headlines).
export interface NewsSlide {
  slide_id: string;
  featured: ContentItem;
  related: ContentItem[];
}

export interface ForYouResponse {
  cursor: string | null;
  items: ContentItem[];
}

export interface NewsResponse {
  cursor: string | null;
  slides: NewsSlide[];
}

export interface Interaction {
  id: string;
  content_item_id: string;
  interaction_type: 'like' | 'bookmark' | 'share' | 'view' | 'complete';
  created_at: string;
}

export interface Transcript {
  id: string;
  content_item_id: string;
  full_text: string;
  summary?: string;
  word_timestamps?: TranscriptSegment[];
  language?: string;
  created_at: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
