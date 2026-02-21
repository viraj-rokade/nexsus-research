# Nexus Research — AI Deep Research Agent

> Ask anything. The AI agent autonomously searches the web, reads sources, and synthesizes a full cited report — streamed live to your browser.

A portfolio-grade AI agent project demonstrating real agentic capabilities: multi-step tool use, live Server-Sent Events streaming, and a polished full-stack UI.

---

## What It Does

1. You type a question (e.g. *"How does CRISPR gene editing work?"*)
2. The agent **plans** sub-questions
3. It calls **web_search** (Tavily) to find relevant sources
4. It calls **extract_page** to read full page content
5. It calls **write_section** to commit each report section as it's written — streamed live to the UI
6. It calls **mark_complete** when the full report is done

Every step is visible in the **Agent Activity Feed** in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Claude (`claude-sonnet-4-6`) via Anthropic API |
| Web Search | Tavily Search API |
| Backend | Python 3.11+ · FastAPI · Server-Sent Events |
| Frontend | Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui |
| State | Zustand |
| Markdown | react-markdown + remark-gfm |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 20+ and pnpm (`npm install -g pnpm`)
- [Anthropic API key](https://console.anthropic.com)
- [Tavily API key](https://app.tavily.com) — free tier: 1,000 req/month

### Backend

```bash
cd nexus-research/backend

# Install dependencies
python -m pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env — fill in ANTHROPIC_API_KEY and TAVILY_API_KEY

# Start the server
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd nexus-research/frontend

# Install dependencies
pnpm install

# Optional: copy env template
cp .env.local.example .env.local

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
nexus-research/
├── backend/
│   ├── main.py                    # FastAPI: POST /api/research, GET /api/research/{id}/stream
│   ├── agent/
│   │   ├── orchestrator.py        # Agentic loop — calls Claude, dispatches tools, streams events
│   │   ├── tools.py               # web_search, extract_page, write_section, mark_complete
│   │   ├── prompts.py             # System prompt controlling research workflow
│   │   └── models.py              # Pydantic request/response models
│   ├── utils/streaming.py         # SSE event formatter helpers
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx               # Home: search input
        │   └── research/
        │       ├── page.tsx           # Server shell (reads ?q= param)
        │       └── ResearchClient.tsx # Client: runs research, two-column layout
        ├── components/
        │   ├── AgentTimeline.tsx      # Live activity feed (left panel)
        │   ├── ReportViewer.tsx       # Streaming markdown report (right panel)
        │   ├── ToolCallCard.tsx       # Individual event card in timeline
        │   ├── SearchInput.tsx        # Home page search bar + example chips
        │   └── CitationBadge.tsx      # Clickable source pill
        └── lib/
            ├── types.ts               # TypeScript interfaces for all SSE events
            ├── store.ts               # Zustand store (events, sections, status)
            └── useResearch.ts         # Custom hook: POST + EventSource stream
```

---

## How It Works — Architecture

```
Browser                          FastAPI                       External APIs
  │                                 │
  │  POST /api/research             │
  │ ─────────────────────────────► ││
  │  ← { research_id }              │
  │                                 │
  │  GET /api/research/{id}/stream  │
  │ ─────────────────────────────► ││
  │                                 │  ┌─ Agentic Loop ──────────────────┐
  │                                 │  │  Claude (tool_use)              │
  │  ← SSE: agent_thinking          │  │    → web_search ──────────────► Tavily
  │  ← SSE: tool_call (web_search)  │  │    ← results                    │
  │  ← SSE: tool_result             │  │    → extract_page ────────────► Tavily
  │  ← SSE: tool_call (extract)     │  │    ← page content               │
  │  ← SSE: tool_result             │  │    → write_section (internal)   │
  │  ← SSE: report_section          │  │    → mark_complete (internal)   │
  │  ← SSE: complete                │  └─────────────────────────────────┘
```

The `write_section` trick: instead of one giant text block at the end, Claude calls `write_section` for each section — the orchestrator intercepts this and immediately sends it as an SSE event, enabling the live report-building effect.

---

## API Reference

### `POST /api/research`
```json
{ "query": "How does CRISPR work?" }
→ { "research_id": "uuid" }
```

### `GET /api/research/{research_id}/stream`
Server-Sent Events stream. Each `data:` line is a JSON event:

| Event type | Fields |
|---|---|
| `agent_thinking` | `content` |
| `tool_call` | `tool`, `input` |
| `tool_result` | `tool`, `result_summary` |
| `report_section` | `title`, `content`, `citations[]` |
| `complete` | `report_title`, `executive_summary` |
| `error` | `message` |
| `stream_end` | *(close signal)* |
