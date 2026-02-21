"""
Agent tools — four functions the Claude agent can call, plus their JSON schemas.

Tools:
  1. web_search      — search the live web via Tavily
  2. extract_page    — fetch full cleaned text of a URL via Tavily
  3. write_section   — internal: commit a report section (triggers SSE event)
  4. mark_complete   — internal: signal research is done (closes the stream)
"""
import os
from typing import Any

from tavily import TavilyClient

_tavily: TavilyClient | None = None


def _get_tavily() -> TavilyClient:
    global _tavily
    if _tavily is None:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise RuntimeError("TAVILY_API_KEY is not set in .env")
        _tavily = TavilyClient(api_key=api_key)
    return _tavily


# ── Tool implementations ────────────────────────────────────────────────────

def web_search(query: str, max_results: int = 5) -> dict[str, Any]:
    """Search the live web and return a list of results."""
    client = _get_tavily()
    response = client.search(
        query=query,
        max_results=min(max_results, 7),
        search_depth="basic",
        include_answer=False,
    )
    results = []
    for r in response.get("results", []):
        results.append({
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("content", "")[:400],
            "published_date": r.get("published_date", ""),
        })
    return {"results": results, "total": len(results)}


def extract_page(url: str) -> dict[str, Any]:
    """Fetch and return the full cleaned text content of a web page."""
    client = _get_tavily()
    response = client.extract(urls=[url])
    items = response.get("results", [])
    if not items:
        return {"url": url, "title": "", "content": "", "error": "No content extracted"}
    item = items[0]
    content = item.get("raw_content", "")[:8000]  # cap to avoid context bloat
    return {
        "url": url,
        "title": item.get("title", ""),
        "content": content,
    }


def write_section(title: str, content: str, citations: list[dict]) -> dict[str, Any]:
    """
    Internal tool: commit a completed section to the report.
    The orchestrator intercepts this call and emits a 'report_section' SSE event.
    Claude should call this once per logical section after gathering enough material.
    """
    return {"acknowledged": True, "title": title}


def mark_complete(report_title: str, executive_summary: str) -> dict[str, Any]:
    """
    Internal tool: signal that research is finished.
    The orchestrator intercepts this and emits a 'complete' SSE event, then closes the stream.
    """
    return {"complete": True, "report_title": report_title}


# ── JSON schemas for Claude's tools parameter ────────────────────────────────

TOOL_SCHEMAS: list[dict] = [
    {
        "name": "web_search",
        "description": (
            "Search the live web for current information on a topic. "
            "Use this to find relevant sources for any sub-question. "
            "Returns a list of results with title, URL, and a short snippet."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query. Be specific and focused.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Number of results to return (1-7). Default is 5.",
                    "default": 5,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "extract_page",
        "description": (
            "Fetch the full cleaned text content of a specific web page. "
            "Use this after web_search when a result looks highly relevant — "
            "it gives you much more detail than the snippet. "
            "Returns the full text (up to 8,000 characters)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The full URL of the page to extract.",
                },
            },
            "required": ["url"],
        },
    },
    {
        "name": "write_section",
        "description": (
            "Commit a completed section to the research report. "
            "Call this once you have gathered enough information to write a substantive section. "
            "Write the content in markdown format (use ## for sub-headings, bullet points, bold text). "
            "Include specific facts, figures, and insights — not vague summaries. "
            "Include 1-5 citations as source objects with url and title."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The section title (e.g. 'Background', 'How It Works', 'Key Challenges').",
                },
                "content": {
                    "type": "string",
                    "description": "The section content in markdown. Be detailed and informative.",
                },
                "citations": {
                    "type": "array",
                    "description": "Sources used for this section.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "url":   {"type": "string"},
                            "title": {"type": "string"},
                        },
                        "required": ["url", "title"],
                    },
                },
            },
            "required": ["title", "content", "citations"],
        },
    },
    {
        "name": "mark_complete",
        "description": (
            "Signal that the research is complete and all sections have been written. "
            "Call this ONLY after you have called write_section for every planned section. "
            "Provide a concise 2-3 sentence executive summary of the entire report."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "report_title": {
                    "type": "string",
                    "description": "A clear, descriptive title for the full research report.",
                },
                "executive_summary": {
                    "type": "string",
                    "description": "2-3 sentence summary of the key findings across all sections.",
                },
            },
            "required": ["report_title", "executive_summary"],
        },
    },
]


# ── Tool dispatcher ─────────────────────────────────────────────────────────

def execute_tool(name: str, inputs: dict[str, Any]) -> Any:
    """Dispatch a tool call by name and return its result."""
    if name == "web_search":
        return web_search(**inputs)
    elif name == "extract_page":
        return extract_page(**inputs)
    elif name == "write_section":
        return write_section(**inputs)
    elif name == "mark_complete":
        return mark_complete(**inputs)
    else:
        return {"error": f"Unknown tool: {name}"}
