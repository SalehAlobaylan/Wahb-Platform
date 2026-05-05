---
name: wahb-platform-design
description: Design guidance for Wahb Platform production UI work.
---

# Wahb Platform Design Guidance

Use this when changing production UI inside `Wahb-Platform`.

## Brand Palette

- Gold `#DAA428` is the primary interaction accent. Use it for primary buttons, active tabs, selected states, progress bars, focus rings, and floating actions.
- Default dark mode is True Black / Charcoal:
  - Page background: `#111111`
  - Cards and popovers: `#1A1A1A`
  - Muted, secondary, and accent surfaces: `#1E1E1E`
  - Borders and inputs: `#2A2A2A`
  - Foreground text: `#F0F0F0`
  - Muted text: `#888888`
- Default light mode is Warm Ivory / Cream:
  - Page background: `#FAF8F3`
  - Cards: `#FFF9F0`
  - Text: `#1A1A2E`

## News Page Exception

Leave the News feed theme alone unless the task explicitly asks for News changes.

- Do not modify `src/app/(feeds)/news/page.tsx` for default brand refreshes.
- Do not change `.news-page` or `.dark .news-page` tokens in `src/app/globals.css`.
- News uses newsprint surfaces and red accents by design.

## UI Rules

- Keep surfaces neutral and restrained; avoid restoring midnight blue, sky blue, cyan, or indigo as brand colors.
- Use Lucide icons for interface actions.
- Keep the mobile shell centered at `max-w-md` with the black outer canvas.
- Use Arabic-first typography via `TheYearofHandicrafts`, with DM Sans and Playfair Display as existing fallbacks.
- Use gold sparingly; passive content chips, cards, and empty states should remain neutral until selected or interactive.
