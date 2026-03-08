# Chaos Dashboard (ADHD Navigator)

## Overview

ChaosDash is a distraction-free productivity and wellness app designed specifically for adults with ADHD. It helps users manage tasks, routines, projects, and daily planning with minimal friction. The app includes AI-powered "Fun Tools" to break tasks into micro-steps, estimate time, and provide ADHD-friendly support.

Key features:
- **Quick Capture FAB** — floating + button; `Ctrl+Shift+K` keyboard shortcut from anywhere; text + voice capture (Web Speech API + Whisper endpoint)
- **Focus Mode** — fullscreen dark overlay with visual ring timer (15/25/45/60m presets); timer state persists in Layout so it runs in the background when overlay is closed; mini timer bar shows at screen bottom when session active but overlay closed; Forest tree gamification (🌱🌿🌳🌲 earned per session)
- **Do Now & Inbox** — quick task capture, prioritize up to 3 items at a time; expandable subtasks
- **Projects** — Kanban board (backlog / doing / done) with hashtag tagging
- **Day Planner** — visual time-blocking with Day/Month calendar toggle and ICS export
- **Fun Tools** — AI task breakdown, time estimation, tone fixer, kindness judge via OpenAI (route: /goblin)
- **Calm Corner** — guided breathing and 5-4-3-2-1 grounding (route: /mindfulness)
- **Routines** — daily/weekly/monthly routines with step timers, streak tracking, 7-day habit grid, Weekly Reset 5-step guided modal
- **Goals & Timeline** — SMART Goal wizard (5-step guided creator with AI help per step, saves SmartGoalData), quick-add goals, timeline/list view, progress tracking by category; AI via `/api/goals/smart-help`
- **Research & News** — tabbed page: "Research Papers" (EuropePMC open-access search) + "News & Community" (Reddit r/ADHD, ADDitude Magazine RSS, CHADD RSS via backend proxy `/api/news`)
- **Mood Tracker** — emoji-scale 1-5 logging with 30-day chart
- **Settings** — visual dark/light toggle cards, PWA install instructions, JSON export/import (file upload), keyboard shortcuts reference, Ctrl+Shift+K hotkey
- **Reminders** — browser notification opt-in with routine reminder time and overdue task nudges (Settings)
- **Panic Mode** — emergency focus mode toggled from the sidebar

All user data (tasks, routines, plants, time blocks) is stored in the browser via `localStorage` through a React context (`useAppState`). There is no user authentication in the frontend; the backend schema has a `users` table but it is not wired to the frontend.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend

- **Framework:** React 18 with TypeScript, bootstrapped via Vite
- **Routing:** `wouter` (lightweight client-side router)
- **State management:** React Context (`AppProvider` in `client/src/lib/useAppState.tsx`) backed by `localStorage` for persistence. All core app data (tasks, routines, plants, time blocks) lives here — no server round-trips needed for CRUD.
- **Server communication:** TanStack React Query + a custom `apiRequest` helper (`client/src/lib/queryClient.ts`). Used for AI API calls to the backend.
- **UI components:** shadcn/ui (New York style) built on Radix UI primitives + Tailwind CSS v4
- **Styling:** Tailwind CSS with CSS custom properties for theming; dark mode default via `next-themes`; Geist (sans) and JetBrains Mono fonts
- **Animations:** `framer-motion` for page transitions, breathing exercises, and plant cards
- **Voice input:** Web Speech API via `useSpeechToText` hook; voice streaming playback via AudioWorklet (`client/integrations/audio/`)
- **Pages:**
  - `/` — Home (Do Now, Inbox, Focus Timer)
  - `/projects` — Kanban board
  - `/planner` — Day Planner
  - `/goblin` — Goblin Tools (AI features)
  - `/mindfulness` — Calm Corner
  - `/research` — Research (OpenAlex)
  - `/routines` — Routines
  - `/plants` — Plant tracker
  - `/settings` — Settings & Data

### Backend

- **Runtime:** Node.js with Express 5 (`server/index.ts`)
- **Language:** TypeScript, run via `tsx` in development; bundled via esbuild for production
- **API routes** (`server/routes.ts`):
  - `POST /api/goblin/breakdown` — AI task breakdown into micro-steps
  - `POST /api/goblin/estimate` — AI time estimation (ADHD-aware)
  - `POST /api/goblin/tone` — Tone fixer / text rewriter
  - `POST /api/goblin/judge` — Kindness/bluntness scorer
  - `GET /api/research` — Proxy to Europe PMC open-access ADHD papers
  - Additional routes for chat/audio/image from ntegration modules
- **Integrations** (`server/integrations/`):
  - `chat/` — conversation + message storage via Postgres (Drizzle ORM)
  - `audio/` — voice chat using OpenAI Whisper + TTS, PCM16 streaming
  - `image/` — image generation via `gpt-image-1`
  - `batch/` — rate-limited batch processing utility with `p-limit` and `p-retry`
- **Static serving:** In production, Express serves the Vite build from `dist/public`. In development, Vite middleware is used (`server/vite.ts`).
- **Storage:** `server/storage.ts` exports a `MemStorage` class (in-memory user store). This is not actively used by the frontend but provides a scaffold for future auth.

### Database

- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`):
  - `users` table: `id` (UUID), `username`, `password`
- **Chat schema** (`shared/models/chat.ts`):
  - `conversations`: `id`, `title`, `createdAt`
  - `messages`: `id`, `conversationId` (FK → conversations), `role`, `content`, `createdAt`
- **Migrations:** `drizzle-kit` (`db:push` script), output to `./migrations`
- **Connection:** Requires `DATABASE_URL` environment variable

> Note: The primary user-facing data (tasks, routines, plants, time blocks) does NOT use the database — it uses `localStorage` only. The database is used exclusively for the AI chat conversation history feature.

### Build

- **Client:** Vite builds to `dist/public`
- **Server:** esbuild bundles `server/index.ts` to `dist/index.cjs`; key server deps are bundled (openai, drizzle-orm, express, pg, etc.) to reduce cold-start syscalls
- **Custom Vite plugin:** `vite-plugin-meta-images.ts` dynamically injects correct domain into `og:image` and `twitter:image` meta tags at build time

---

## External Dependencies

### AI / OpenAI
- **OpenAI SDK** (`openai` npm package) — used for:
  - Chat completions (Goblin Tools task breakdown and time estimation)
  - Voice chat (Whisper transcription + TTS streaming)
  - Image generation (`gpt-image-1`)
- **Environment variables required:**
  - `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (AI Integrations)
  - `AI_INTEGRATIONS_OPENAI_BASE_URL` — custom base URL (proxy)
- **Model used:** `gpt-5.2` for Goblin Tools chat completions

### Database
- **PostgreSQL** via `pg` driver
- **Environment variable required:** `DATABASE_URL`
- Used for: chat conversation/message persistence

### External APIs (no auth required)
- **Europe PMC REST API** — free open-access ADHD paper search, proxied through the backend (`GET /api/research`). Returns title, authors, year, journal, abstract, and open-access links.
- **Google Fonts** — Geist and JetBrains Mono loaded via `<link>` in `index.html`

### Key Frontend Libraries
| Library | Purpose |
|---|---|
| `wouter` | Client-side routing |
| `@tanstack/react-query` | Server state / API calls |
| `next-themes` | Dark/light theme management |
| `framer-motion` | Animations |
| `react-hook-form` + `@hookform/resolvers` | Form handling |
| `date-fns` | Date formatting |
| `zod` + `drizzle-zod` | Schema validation |
| `lucide-react` | Icons |
| `embla-carousel-react` | Carousel components |
| Radix UI (full suite) | Accessible headless UI primitives |