# CMS Backend Requirements (Go Monolith)

This document outlines the requirements for the **Wahb CMS Backend**, typically a Go monolith. It functions as the primary API gateway, content store, and orchestration layer for the user-facing application.

## 1. Core Responsibilities
- **API Serving**: Expose REST/gRPC endpoints for the frontend (Feeds, Interactions, Auth).
- **Domain Logic**: Handle business rules for content delivery, user interactions, and session management.
- **Data Persistence**: Manage the primary relational database (PostgreSQL) for users, content metadata, and interactions.
- **Orchestration**: Coordinate with the Aggregation Service (worker fleet) for heavy lifting (media processing, embeddings).

## 2. API Contract (Frontend Contract)
The frontend expects the following endpoints. See `src/types/feed.ts` and `src/lib/api/feeds.ts` for exact Typescript interface definitions.

### 2.1 Feeds
- `GET /api/v1/feed/foryou`
  - **Query Params**: `cursor` (string), `limit` (int).
  - **Response**: `ForYouResponse` (List of `ContentItem` optimized for vertical video/audio scrolling).
  - **Logic**: Retrieve items ranked by personalization algorithms (or chronological for MVP). Exclude seen items.

- `GET /api/v1/feed/news`
  - **Query Params**: `cursor` (string), `limit` (int).
  - **Response**: `NewsResponse` (List of `NewsSlide`).
  - **Logic**: Assemble slides. A "Slide" consists of:
    - 1 `featured` item (Article).
    - 3 `related` items (Tweet, Comment, Article) derived from vector similarity search.

- `GET /api/v1/content/:id`
  - **Response**: Single `ContentItem`.

### 2.2 Interactions
- `POST /api/v1/interactions`
  - **Body**: `{ content_item_id, interaction_type: 'like'|'bookmark'|'share'|'view'|'complete', metadata? }`
  - **Responsibility**: Record the event, update counts (async or sync), check for achievements/gamification, update user interest vector.

- `DELETE /api/v1/interactions`
  - **Query Params**: `content_item_id`, `type`.
  - **Responsibility**: Revert the interaction.

- `GET /api/v1/interactions/bookmarks`
  - **Response**: `ForYouResponse` (List of bookmarked content).

## 3. Data Models (PostSchema Requirements)

### 3.1 ContentItem Table
Must support fields required by `src/types/feed.ts`:
- `id` (UUID)
- `type` (Enum: ARTICLE, VIDEO, TWEET, COMMENT, PODCAST)
- `title`, `body_text`, `excerpt`, `media_url`, `thumbnail_url`
- `transcript_id` (FK to transcripts)
- `topic_tags` (Array/JSONB)
- `status` (Enum: PENDING, PROCESSING, READY, FAILED)
- `source_feed_url`, `original_url`, `author`, `source_name`
- `published_at`, `created_at`
- Counters: `like_count`, `comment_count`, `share_count`, `view_count`

### 3.2 Interaction Table
- `id` (UUID)
- `user_id` (UUID)
- `content_item_id` (UUID)
- `interaction_type` (Enum)
- `created_at`
- **Unique Constraint**: `(user_id, content_item_id, interaction_type)` (except for 'view' which might be log-only).

## 4. Integration Points with Aggregation Service
- **Status Updates**: The CMS must expose an endpoint (or listen to a queue) for the Aggregation Service to update content status (e.g., from `PROCESSING` to `READY`) and populate fields like `media_url` (S3 path).
- **Ingestion Triggers**: Admin API to manually trigger ingestion for a specific URL or Feed.

## 5. Security & Auth
- Standard Bearer Token (JWT) authentication for all user-facing endpoints.
- Admin-only roles for ingestion triggers and dashboard access.

## 6. Performance Goals
- **Feed Latency**: < 200ms p95.
- **Caching**: heavily cache feed responses (e.g., Redis) for anonymous or "global" feed segments.
