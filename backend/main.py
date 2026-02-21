"""
Nexus Research — FastAPI backend

Two endpoints:
  POST /api/research               → accept query, start research, return research_id
  GET  /api/research/{id}/stream   → SSE stream of agent events for that research_id
"""
import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agent.models import ResearchRequest, ResearchResponse
from agent.orchestrator import ResearchOrchestrator
from utils.streaming import format_sse, sse_error, sse_heartbeat

load_dotenv()

# ── In-memory store: research_id → asyncio.Queue ────────────────────────────
# Each queue holds dicts (SSE event payloads). Sentinel value None signals done.
_queues: dict[str, asyncio.Queue] = {}
_QUEUE_TTL_SECONDS = 600  # drop queues older than 10 minutes (enough for any research job)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Cleanup: drain all queues on shutdown
    _queues.clear()


app = FastAPI(
    title="Nexus Research API",
    description="Deep Research AI Agent powered by Claude",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "nexus-research"}


@app.post("/api/research", response_model=ResearchResponse)
async def start_research(body: ResearchRequest):
    """
    Accept a research query, create a queue, kick off the agent in the background,
    and return the research_id so the client can open the SSE stream.
    """
    research_id = str(uuid.uuid4())
    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    _queues[research_id] = queue

    # Run the agent in the background — it will push events into the queue
    asyncio.create_task(_run_research(research_id, body.query, queue))

    return ResearchResponse(research_id=research_id)


@app.get("/api/research/{research_id}/stream")
async def stream_research(research_id: str):
    """
    SSE endpoint — streams all agent events for a research job.
    The client should open this immediately after receiving the research_id.
    """
    queue = _queues.get(research_id)
    if queue is None:
        raise HTTPException(status_code=404, detail="Research job not found or expired.")

    return StreamingResponse(
        _event_generator(research_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering if behind a proxy
        },
    )


# ── Internal helpers ─────────────────────────────────────────────────────────

async def _run_research(research_id: str, query: str, queue: asyncio.Queue) -> None:
    """Background task: run the agent and push events into the queue."""
    print(f"[research] Starting: {query!r}")
    orchestrator = ResearchOrchestrator()
    try:
        async for event in orchestrator.run(query):
            print(f"[research] Event: {event.get('type')} | {str(event)[:120]}")
            await queue.put(event)
    except Exception as exc:
        print(f"[research] UNHANDLED EXCEPTION: {type(exc).__name__}: {exc}")
        import traceback; traceback.print_exc()
        await queue.put({"type": "error", "message": str(exc)})
    finally:
        print(f"[research] Stream closed for {research_id[:8]}")
        await queue.put(None)  # sentinel: signals the stream generator to close


async def _event_generator(research_id: str, queue: asyncio.Queue):
    """
    Async generator that pulls events from the queue and yields SSE-formatted strings.
    Sends a heartbeat every 15 seconds to keep the connection alive.
    Cleans up the queue entry when done.
    """
    try:
        while True:
            try:
                event: dict | None = await asyncio.wait_for(queue.get(), timeout=15.0)
            except asyncio.TimeoutError:
                yield sse_heartbeat()
                continue

            if event is None:
                # Sentinel received — research is done
                yield format_sse({"type": "stream_end"})
                break

            yield format_sse(event)

            # If the event itself signals completion, close after sending it
            if event.get("type") in ("complete", "error"):
                # Drain until sentinel so the background task doesn't block
                while True:
                    try:
                        leftover = await asyncio.wait_for(queue.get(), timeout=2.0)
                        if leftover is None:
                            break
                    except asyncio.TimeoutError:
                        break
                yield format_sse({"type": "stream_end"})
                break
    finally:
        _queues.pop(research_id, None)
