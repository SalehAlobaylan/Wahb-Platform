# Wahb Platform

A mobile-first social platform featuring an audio-first "For You" feed and a magazine-style News feed.

## Overview

Wahb Platform is a modern web application built with Next.js that delivers a social content experience optimized for mobile devices. The platform features two main feeds:

- **For You Feed**: An audio-first personalized content feed
- **News Feed**: A magazine-style news and content discovery experience

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository and navigate to the platform directory:
```bash
cd Wahb-Platform
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
npm run build
npm run start
```

### Testing

Run tests:

```bash
npm test
npm run test:watch
```

## Project Structure

```
src/
├── app/           # Next.js app router pages and layouts
├── components/    # Reusable UI components
├── lib/           # Utility functions and configurations
└── types/         # TypeScript type definitions
```

## Features

- Mobile-first responsive design
- Audio-first content consumption
- Personalized content feeds
- Magazine-style news layout
- Smooth animations and transitions
- Optimistic UI updates
- Type-safe development with TypeScript

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Contributing

This project is part of the Wahb meta-monorepo. Please refer to the main project guidelines for contribution standards.
