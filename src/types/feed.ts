// Feed API Types

export type ContentType = 'NEWS' | 'ARTICLE' | 'VIDEO' | 'TWEET' | 'COMMENT' | 'PODCAST';
export type SourceType = 'RSS' | 'PODCAST' | 'YOUTUBE' | 'UPLOAD' | 'MANUAL' | 'TELEGRAM' | 'TWITTER';
export type NewsWindow = 'today' | 'week' | 'month';
export type NewsLifecycle = 'breaking' | 'active' | 'cooling' | 'historical';

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
  source_image_url?: string;
  // Ingest source (RSS/TELEGRAM/...) — lets the badge distinguish a Telegram
  // channel post (format=ARTICLE) from an RSS article.
  source?: SourceType;
  // Story news-taxonomy slug (politics/economy/...) for the topic chip; set on
  // related-story items. general/unknown → no chip.
  category?: string;

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
  bookmarked_at?: string;
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
  source?: SourceType;
  title?: string;
  excerpt?: string;
  body_text?: string;
  author?: string;
  source_name?: string;
  thumbnail_url?: string;
  source_image_url?: string;
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
  last_member_at: string;
  lifecycle: NewsLifecycle;
  is_carryover?: boolean;
  reason?: string;
  title?: string;
  excerpt?: string;
  thumbnail_url?: string;
  source_name?: string;
  source_image_url?: string;
  // Lead member's format + source → badge a related card by its lead post type
  // and detect a Telegram-led story.
  format?: string;
  source?: SourceType;
  // News-taxonomy slug (politics/economy/...) for the topic chip.
  category?: string;
  published_at: string;
  member_count: number;
  // Distinct sources among the story's members — the "covered by N sources"
  // aggregation signal. Present on the featured story; absent/0 elsewhere.
  source_count?: number;
  // Source-grounded AI digest of the whole story (headline lede + bullets).
  // Present on the featured story once generated; absent → fall back to excerpt.
  summary?: string;
  bullets?: string[];
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
// StoryMeta carries circulation context for a slide's featured story: update
// recency, lifecycle, and the multi-source coverage signal when available.
export interface StoryMeta {
  label: string;
  memberCount: number;
  sourceCount: number;
  updatedAt?: string;
  lifecycle?: NewsLifecycle;
  isCarryover?: boolean;
  reason?: string;
  // Source-grounded AI digest of the story (Slice 8) — rendered under the
  // headline on the featured slide. Empty/absent → not shown.
  summary?: string;
  bullets?: string[];
  // News-taxonomy slug (politics/economy/...) → topic chip. general/unknown → no chip.
  category?: string;
}

export interface NewsSlide {
  slide_id: string;
  featured: ContentItem;
  // coverage = THIS story's other member posts (the actual sources covering the
  // same event), each attributed to its source. Distinct from `related`, which
  // is OTHER stories' headlines. Empty for a single-source story.
  coverage?: ContentItem[];
  related: ContentItem[];
  story?: StoryMeta;
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
  interaction_type: 'like' | 'bookmark' | 'share' | 'view' | 'complete' | 'comment';
  created_at: string;
}

export interface ContentComment {
  id: string;
  text: string;
  author?: string;
  is_mine: boolean;
  created_at: string;
}

export interface CommentsResponse {
  cursor: string | null;
  items: ContentComment[];
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
