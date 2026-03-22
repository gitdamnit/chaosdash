# ADHDPenguin
<img width="240" height="240" alt="adhdpenguin-logo" src="https://github.com/user-attachments/assets/db9006b5-61f1-4351-b728-9e9e29113e13" />

## Overview

ADHDPenguin is a distraction-free productivity and wellness app designed specifically for adults with ADHD. It helps users manage tasks, routines, projects, and daily planning with minimal friction. The app includes AI-powered "Fun Tools" to break tasks into micro-steps, estimate time, and provide ADHD-friendly support.

<img width="475" height="139" alt="image" src="https://github.com/user-attachments/assets/d10214c6-0701-4f15-8d35-991c9ce2d8fd" />

# ADHD Penguin

A productivity and wellness toolkit built specifically for adults with ADHD. ADHD Penguin brings together task management, AI-powered tools, emotional regulation exercises, and research resources into one calm, focused space — designed around how ADHD brains actually work.

## Who It's For

Adults with ADHD (or anyone who struggles with executive function) who want a single app that understands the real challenges: task paralysis, time blindness, emotional dysregulation, and the constant mental juggle.

## Features

### Task Management
- **Home Dashboard** — A daily command center with an inbox/do-now/done task board, pinned sticky notes, a brain dump area for unfiltered thoughts, and a quick-glance view of today's mood and routine streaks.
- **Projects** — A Kanban-style board (Backlog → Doing → Done) for bigger, multi-step projects with tagging support.
- **Planner** — A visual daily time-blocking calendar where you drag and drop color-coded blocks to plan your day.

### AI-Powered Tools
- **Magic ToDo** — Paste any overwhelming task and AI breaks it into tiny, concrete micro-steps you can actually start. Adjustable difficulty level.
- **Time Estimator** — Get brutally honest time estimates that account for the "ADHD tax" (task initiation delays, context-switching, rabbit holes). Includes per-step breakdowns.
- **Tone Fixer** — Rewrite any message in a different tone (formal, casual, soft, direct, assertive, or plain language). Great for emails you've been avoiding.
- **Kindness Judge** — Paste a message and get a 1–10 kindness score with an explanation of how it lands, plus a gentler rewrite if needed.
- **Voice Input** — All AI tools support speech-to-text so you can talk instead of type.

### Regulation & Wellness
- **Mindfulness** — Guided breathing exercises (Box Breathing, 4-7-8, Energizing Breath, and more) with animated visuals and timed phases.
- **Mood Tracker** — Log your mood daily with emoji and notes, then view trends over time.
- **Goals** — Set goals using an AI-assisted SMART framework that walks you through each step (Specific, Measurable, Achievable, Relevant, Time-bound) with ADHD-aware coaching.
- **Routines** — Track daily, weekly, or monthly habits with streak counts and step-by-step breakdowns for each routine.

### Research & Learning
- **Research Hub** — Search open-access academic papers about ADHD from four databases: EuropePMC, OpenAlex, Semantic Scholar, and PubMed.
- **Book Finder** — Search free and borrowable books from Open Library, Project Gutenberg, Google Books, Standard Ebooks, and dBooks.
- **News Feed** — Live ADHD news and community posts pulled from r/ADHD, ADDitude Magazine, and CHADD.

### Community
- **Body Doubling** — Start a timed work session and see who else is working alongside you in real time. Choose from 25, 45, 60, or 90-minute sessions. Powered by WebSockets for live updates.

### Other
- **Settings** — Customize your display name, manage your account, and configure preferences.
- **Admin Panel** — User management for app administrators.
- **Authentication** — Sign in with your Replit account. All data is private and tied to your login.

## Tech Stack

| Layer       | Technology                                              |
|-------------|---------------------------------------------------------|
| Frontend    | React 19, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend     | Express 5, Node.js, TypeScript                         |
| Database    | PostgreSQL with Drizzle ORM                             |
| AI          | OpenAI API (GPT) for task breakdown, time estimates, tone analysis, SMART goal coaching |
| Auth        | Replit OpenID Connect                                   |
| Real-time   | WebSockets (ws) for body doubling sessions              |
| Data Sources| EuropePMC, OpenAlex, Semantic Scholar, PubMed, Reddit, ADDitude, CHADD, Open Library, Project Gutenberg, Google Books |

## Pages

| Route          | Page           | Description                                    |
|----------------|----------------|------------------------------------------------|
| `/`            | Home           | Dashboard with tasks, notes, brain dump, mood  |
| `/projects`    | Projects       | Kanban project board                           |
| `/planner`     | Planner        | Visual daily time-block calendar               |
| `/fun-tools`   | Fun Tools      | AI tools (Magic ToDo, Time Estimator, Tone Fixer, Kindness Judge) |
| `/mindfulness` | Mindfulness    | Guided breathing exercises                     |
| `/research`    | Research       | Academic paper and book search, news feed      |
| `/routines`    | Routines       | Habit and routine tracker with streaks         |
| `/goals`       | Goals          | SMART goal setting with AI assistance          |
| `/mood`        | Mood Tracker   | Daily mood logging and trends                  |
| `/body-double` | Body Doubling  | Timed co-working sessions with live presence   |
| `/settings`    | Settings       | Account and display preferences                |
| `/admin`       | Admin          | User management (admin only)                   |

## Running Locally

1. **Install dependencies**
   ```
   npm install
   ```

2. **Set up the database**
   Make sure PostgreSQL is running and the `DATABASE_URL` environment variable is set, then push the schema:
   ```
   npm run db:push
   ```

3. **Configure environment variables**
   The app needs:
   - `DATABASE_URL` — PostgreSQL connection string
   - `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key for AI features
   - `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI-compatible API base URL
   - Replit auth variables (automatically set when running on Replit)

4. **Start the dev server**
   ```
   npm run dev
   ```
   This starts both the Express backend and Vite frontend on a single port.

5. **Build for production**
   ```
   npm run build
   npm start
   ```


   ## Yay Pictures!

<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/e24e18ff-527f-45a1-a67f-04088dbc3b0d" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/d94eb31d-a6d0-429e-bc0b-68920f6c9566" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/c0ab5ca1-d751-42be-8a2d-9b6a0173616d" />
<img width="400" height="230" alt="image" src="https://github.com/user-attachments/assets/ca050eca-b0a8-4ea0-82b9-27cd2ecf35fb" />
<img width="400" height="230" alt="image" src="https://github.com/user-attachments/assets/5d236d89-678c-4384-bfa6-66cbaa58fa9e" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/40d326e4-791b-40a5-b6fc-9df957c1ae76" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/94c010e6-9599-46a5-bf12-3d2328178671" />
<img width="400" height="315" alt="image" src="https://github.com/user-attachments/assets/d7d3a0fa-da6f-412a-a00a-6396dce5460e" />
<img width="400" height="230" alt="image" src="https://github.com/user-attachments/assets/2b392bb6-abc8-41ef-8ee9-c4512cf73518" />
<img width="400" height="230" alt="image" src="https://github.com/user-attachments/assets/7d8a9be9-b019-40be-8668-73624ac79eda" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/bc09b710-64d7-47c9-bcbf-577ea0fb958f" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/2867b5c5-ae38-4007-8f70-a654bd280c4a" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/6b0c1c55-515b-4aa9-b4d6-00b05889f7c9" />
