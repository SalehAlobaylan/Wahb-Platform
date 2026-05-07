// Feed API Types

export type ContentType = 'ARTICLE' | 'VIDEO' | 'TWEET' | 'COMMENT' | 'PODCAST';
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
