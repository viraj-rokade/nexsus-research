# Nexus Research — Backend

FastAPI backend powering the Nexus Research AI agent. Exposes two HTTP endpoints; the agent runs an agentic loop calling Claude with tools, streaming every step to the frontend via Server-Sent Events.

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- [Anthropic API key](https://console.anthropic.com)
- [Tavily API key](https://app.tavily.com) — free tier: 1,000 req/month

### 2. Install dependencies

```bash
cd nexus-research/backend
python -m pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Open .env and fill in your API keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   TAVILY_API_KEY=tvly-...
```

### 4. Start the server

```bash
python -m uvicorn main:app --reload --port 8000
```

Server runs at `http://localhost:8000`. Auto-reloads on file changes.

> **Windows + Git Bash note:** Python may not be on the bash PATH. Use `cmd.exe /c "python -m uvicorn ..."` or run from a regular Command Prompt / PowerShell terminal.

---

## API Reference

### `POST /api/research`

Starts a new research job. Returns a `research_id` you use to open the SSE stream.

**Request body:**
```json
{ "query": "How does CRISPR gene editing work?" }
```

**Response:**
```json
{ "research_id": "550e8400-e29b-41d4-a716-446655440000" }
```

---

### `GET /api/research/{research_id}/stream`

Opens a Server-Sent Events stream for the given research job. Each `data:` line is a JSON object.

**Event types:**

| `type` | Additional fields | Description |
|---|---|---|
| `agent_thinking` | `content: string` | Claude's reasoning / plan text |
| `tool_call` | `tool: string`, `input: object` | A tool Claude is about to call |
| `tool_result` | `tool: string`, `result_summary: string` | What the tool returned (abbreviated) |
| `report_section` | `title: string`, `content: string`, `citations: [{url, title}]` | A completed report section |
| `complete` | `report_title: string`, `executive_summary: string` | Research finished |
| `error` | `message: string` | An error occurred |
| `stream_end` | *(no extra fields)* | Stream closed — connection will drop |

**Example stream:**
```
data: {"type":"agent_thinking","content":"I'll research this in three parts..."}

data: {"type":"tool_call","tool":"web_search","input":{"query":"CRISPR mechanism 2024"}}

data: {"type":"tool_result","tool":"web_search","result_summary":"Found 5 results"}

data: {"type":"report_section","title":"What is CRISPR?","content":"...","citations":[...]}

data: {"type":"complete","report_title":"CRISPR Gene Editing","executive_summary":"..."}

data: {"type":"stream_end"}
```

---

## Agent Tools

The agent has four tools defined in `agent/tools.py`:

| Tool | External API | Purpose |
|---|---|---|
| `web_search(query, max_results)` | Tavily `/search` | Find relevant web pages for a query |
| `extract_page(url)` | Tavily `/extract` | Fetch the full cleaned text of a page |
| `write_section(title, content, citations)` | None (internal) | Commit a report section — immediately streamed to frontend |
| `mark_complete(report_title, executive_summary)` | None (internal) | Signal the research is done, close the stream |

The `write_section` / `mark_complete` tools are not real API calls — the orchestrator intercepts them and converts them to SSE events, enabling the live section-by-section report-building effect.

---

## File Structure

```
backend/
├── main.py              # FastAPI app — CORS, POST /api/research, GET /api/research/{id}/stream
├── agent/
│   ├── orchestrator.py  # Agentic loop — calls Claude, dispatches tools, yields SSE events
│   ├── tools.py         # Tool functions + JSON schemas for Claude's tool_use API
│   ├── prompts.py       # System prompt controlling the research workflow
│   └── models.py        # Pydantic request/response models
├── utils/
│   └── streaming.py     # SSE event formatter helpers
├── requirements.txt     # Dependencies (no version pins for broad Python compatibility)
├── .env.example         # Template — copy to .env and fill in real keys
└── .env                 # Your real keys — NEVER commit this file
```

---

## Environment Variables

| Variable | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | [console.anthropic.com](https://console.anthropic.com) |
| `TAVILY_API_KEY` | Yes | [app.tavily.com](https://app.tavily.com) — free tier available |

---

## Dependencies

```
fastapi          — Web framework
uvicorn          — ASGI server
anthropic        — Anthropic SDK (Claude API, tool-use)
tavily-python    — Tavily Search & Extract API
python-dotenv    — Load .env file
pydantic         — Request/response validation
httpx            — Async HTTP client (used by Anthropic SDK)
```

Install with: `python -m pip install -r requirements.txt`

---

## How the Agentic Loop Works

1. Frontend POSTs a query → backend creates a UUID, starts a background `asyncio.Queue` task, returns the UUID immediately
2. Frontend opens SSE GET stream using the UUID
3. Background task runs `ResearchOrchestrator.run(query)`:
   - Calls Claude with `tools` + current `messages`
   - Claude returns `tool_use` blocks
   - Orchestrator executes each tool, yields SSE events, appends `tool_result` to messages
   - Loop repeats until Claude returns `stop_reason == "end_turn"` (which happens after `mark_complete` is called)
4. Every yielded event is put on the asyncio.Queue and forwarded to the SSE stream
5. `stream_end` event closes the connection
