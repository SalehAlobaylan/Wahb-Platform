# Wahb-Platform

The consumer app — the product itself. A mobile-first Next.js PWA delivering Wahb's two-feed experience: **For You** (TikTok-style full-screen audio/video) and **News** (magazine-style story-slides). It renders feeds, plays media, and records interactions.

It is a **thin client over CMS**: a catch-all proxy (`/api/v1/[...path]`) forwards reads/interactions to CMS and attaches the user's access token from an httpOnly cookie, so the browser never holds the token. It does **not** scrape, transcode, embed, or write to the database directly.

**Port:** 3000 · **Production:** https://wahb.salehspace.dev · **Stack:** Next.js 16 (App Router), React 19, TypeScript, Zustand, TanStack Query, Framer Motion, Tailwind v4

> Full feature + architecture reference: [`../docs/wahb-platform.md`](../docs/wahb-platform.md). Design system: [`SKILL.md`](SKILL.md) and the repo-root `DESIGN.md`. Product intent: [`../docs/PRD.md`](../docs/PRD.md).

## The Two Feeds

- **For You** — full-screen vertical snap-scroll of MP4 audio/video. One card per viewport (`scroll-snap-mandatory`); active card auto-plays, previous pauses; tap toggles play/pause; infinite cursor-paginated. Items must have an MP4 `media_url` and `status=READY` (VIDEO + PODCAST). Includes progress bar, playback-speed control, and a draggable bottom sheet (Comments / Transcript / About).
- **News** — full-screen snap-scroll of **story-slides**: one featured story + up to 3 related stories per slide. Tap opens the spring-animated full-screen `ArticleReader`. Keeps its own newsprint theme (red accents).

## Other Features

- **Global audio player** — a hidden `<audio>` persists across navigation; leaving For You mid-playback transfers playback at the same timestamp, with a floating `NowPlayingBar` on non-feed pages.
- **Interactions** — like, bookmark, share, view, complete → CMS `/interactions`. Like/bookmark are idempotent (toggle) with optimistic UI + rollback. Anonymous users get a per-tab `session_id` for `is_liked`/`is_bookmarked` flags.
- **Saved / Search / Profile** — bookmarks (filter + sort), debounced search against CMS `/content/search`, and profile/create surfaces.

> MVP surfaces — comments, profile, and search "trending" — are intentionally mocked / static until wired to the backend.

## Getting Started

```bash
npm install
cp .env.example .env.local   # configure backend URLs
npm run dev                  # http://localhost:3000
```

Requires Node.js 20+.

## Architecture

- **Thin client / BFF proxy** — `/api/v1/[...path]/route.ts` forwards all CMS reads/interactions (GET/POST/PUT/PATCH/DELETE) to `NEXT_PUBLIC_API_URL` / `CMS_BASE_URL`, stripping hop-by-hop headers and attaching the `wahb_access_token` cookie as a Bearer header so user-authenticated CMS routes work transparently. `/api/auth/*` (register/login/refresh/logout/me/profile/change-password) proxy to IAM; `/api/content/submit` and `/api/transcribe` are dedicated server routes.
- **State** — Zustand stores (`auth-store`, `feed-store`, `now-playing-store`); TanStack Query for server data; the News story-slide response is adapted into the editorial `NewsSlide` shape at the fetch boundary so the magazine UI is decoupled from CMS's model.
- **Cannot** — scrape, run FFmpeg, run ML, or write directly to the DB; For You only ever plays MP4 URLs served by CMS.

## Design System

Mobile-first, max-width app shell on a black outer canvas; warm **gold `#DAA428`** accent on neutral editorial surfaces (light: Warm Ivory; dark: True Black). The News feed owns a separate `.news-page` newsprint theme with red accents — don't replace those with gold. Arabic-first typography (`TheYearofHandicrafts`). See [`SKILL.md`](SKILL.md) for the full token contract.

## Configuration

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | yes | http://localhost:8080/api/v1 | CMS public API base (used by the `/api/v1` proxy) |
| `CMS_BASE_URL` | fallback | http://localhost:8080/api/v1 | Alternate CMS base if `NEXT_PUBLIC_API_URL` unset |
| `IAM_API_URL` | for auth | http://localhost:4003/api/v1 | IAM base for register/login |
| `NEXT_PUBLIC_USE_MOCK_DATA` | no | false | Force mock-client surfaces |
| `NEXT_PUBLIC_ENABLE_DEBUG_MODE` | no | false | Debug UI |

> `NEXT_PUBLIC_IAM_BASE_URL` is referenced in code but **missing from `.env.example`** — set it if your auth flow needs a browser-side IAM base.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run test:watch` | Jest watch mode |

## Project Structure

```
src/
├── app/              # App Router — (feeds) group (For You, news, saved), create, login, register, profile, search, settings
│   └── api/          # BFF routes: v1/[...path] proxy, auth/*, content/submit, transcribe
├── components/
│   ├── feed/         # for-you-card, news-slide, article-reader, draggable-bottom-sheet, view-tracker, …
│   └── layout/  profile/  ui/
├── lib/
│   ├── api/          # feeds, content, auth clients + mock-client
│   ├── stores/       # auth-store, feed-store, now-playing-store (Zustand)
│   ├── hooks/        # use-feed, use-auth, use-my-content, use-publish-content
│   └── i18n/ messages/   # bilingual AR/EN
└── types/            # feed, auth types
```
