# Nexus Research — Frontend

Next.js 15 frontend for the Nexus Research AI agent. Submits queries to the backend, opens a Server-Sent Events stream, and renders agent activity + report sections in real time.

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Backend running at `http://localhost:8000` (see `../backend/README.md`)

### 2. Install dependencies

```bash
cd nexus-research/frontend
pnpm install
```

### 3. Start the dev server

```bash
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000). Hot-reloads on file changes.

---

## Pages

### `/` — Home
Large search input with example query chips. Submitting navigates to `/research?q=<query>`.

### `/research?q=<query>` — Research View
Two-column layout (stacked on mobile):
- **Left — Agent Activity Feed:** Live scrolling timeline of tool calls, searches, and Claude's reasoning. Color-coded cards: gray = thinking, blue = web search, purple = page extract, green = section written, red = error.
- **Right — Report Output:** Markdown report sections fade in as they're written. Each section has clickable citation pills. On completion: executive summary box + Copy and Download buttons.

---

## File Structure

```
frontend/src/
├── app/
│   ├── layout.tsx             # Root layout — dark theme, metadata
│   ├── globals.css            # Tailwind v4 config, animations
│   ├── page.tsx               # Home page — search input + example chips
│   └── research/
│       ├── page.tsx           # Server component — reads ?q= URL param
│       └── ResearchClient.tsx # Client component — SSE hook, two-column layout
├── components/
│   ├── SearchInput.tsx        # Home search bar + example query chips
│   ├── AgentTimeline.tsx      # Left panel — live activity feed
│   ├── ReportViewer.tsx       # Right panel — markdown report + copy/download
│   ├── ToolCallCard.tsx       # Individual event cards in the timeline
│   └── CitationBadge.tsx      # Clickable source pill (links to original URL)
└── lib/
    ├── types.ts               # TypeScript interfaces for all SSE event types
    ├── store.ts               # Zustand store (events, sections, status, error)
    └── useResearch.ts         # Custom hook: POST to backend + open EventSource stream
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15 (App Router) | Framework |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | v4 | Styling |
| shadcn/ui | latest | UI primitives |
| Zustand | 5 | Client state management |
| react-markdown | 10 | Render markdown report sections |
| remark-gfm | latest | GitHub-flavored markdown (tables, strikethrough) |

---

## Environment Variables

No environment variables are required by default — the backend URL is hardcoded to `http://localhost:8000` in `useResearch.ts`.

If you deploy the backend to a different host, create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then update `useResearch.ts` to use `process.env.NEXT_PUBLIC_API_URL`.

---

## Available Scripts

```bash
pnpm dev       # Start dev server (http://localhost:3000)
pnpm build     # Production build
pnpm start     # Run production build
pnpm lint      # ESLint
```

---

## How SSE Streaming Works

1. `useResearch.ts` POSTs `{ query }` to `POST /api/research` → receives `research_id`
2. Opens `new EventSource("/api/research/{id}/stream")` (proxied through Next.js to avoid CORS)
3. Each `message` event parses the JSON data and dispatches to the Zustand store
4. React components read from the store and render in real time — no polling, no full re-renders
5. `stream_end` event closes the EventSource connection
