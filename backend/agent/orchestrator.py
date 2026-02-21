"""
ResearchOrchestrator — the heart of the Nexus Research agent.

Runs the agentic loop:
  1. Call Claude with tools defined
  2. Claude returns tool_use blocks
  3. Execute the tool, intercept write_section / mark_complete to emit SSE events
  4. Append tool_result to messages
  5. Repeat until stop_reason == "end_turn"

Yields dicts (SSE event payloads) for each notable step.
"""
import asyncio
import json
import os
from collections.abc import AsyncGenerator
from typing import Any

import anthropic

from .prompts import SYSTEM_PROMPT
from .tools import TOOL_SCHEMAS, execute_tool

MAX_ITERATIONS = 40  # hard ceiling on the loop to prevent runaway costs


def _get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set in .env")
    return anthropic.Anthropic(api_key=api_key)


class ResearchOrchestrator:
    def __init__(self):
        self._client = _get_client()

    async def run(self, query: str) -> AsyncGenerator[dict[str, Any], None]:
        """
        Run the full research loop for `query`.
        Yields SSE event dicts as the agent works.
        The caller is responsible for formatting these as SSE and sending them.
        """
        messages: list[dict] = [{"role": "user", "content": query}]
        iterations = 0

        # Run the blocking Anthropic API calls in a thread pool so we don't
        # block the FastAPI event loop.
        loop = asyncio.get_running_loop()

        while iterations < MAX_ITERATIONS:
            iterations += 1

            # ── Call Claude ───────────────────────────────────────────────
            try:
                # Snapshot messages for the lambda to avoid closure issues
                msgs_snapshot = list(messages)
                response = await loop.run_in_executor(
                    None,
                    lambda: self._client.messages.create(
                        model="claude-sonnet-4-6",
                        max_tokens=8096,
                        system=SYSTEM_PROMPT,
                        tools=TOOL_SCHEMAS,
                        messages=msgs_snapshot,
                    ),
                )
            except Exception as exc:
                print(f"[orchestrator] Claude call failed (iter {iterations}): {type(exc).__name__}: {exc}")
                yield {"type": "error", "message": f"Claude API error: {type(exc).__name__}: {exc}"}
                return

            # ── Process response content blocks ───────────────────────────
            assistant_content = []
            tool_use_blocks = []

            for block in response.content:
                assistant_content.append(block)

                if block.type == "text" and block.text.strip():
                    # Emit the agent's thinking/narration as an event
                    yield {"type": "agent_thinking", "content": block.text.strip()}

                elif block.type == "tool_use":
                    tool_use_blocks.append(block)

            # Append assistant turn to messages
            messages.append({"role": "assistant", "content": assistant_content})

            # ── If no tool calls, we're done ──────────────────────────────
            if not tool_use_blocks:
                # Agent finished without calling mark_complete — emit done anyway
                yield {"type": "complete", "report_title": "Research Complete", "executive_summary": ""}
                return

            # ── Execute each tool call ────────────────────────────────────
            tool_results = []

            for block in tool_use_blocks:
                tool_name = block.name
                tool_input = block.input

                # Emit the tool call event (so the UI shows what the agent is doing)
                yield {"type": "tool_call", "tool": tool_name, "input": tool_input}

                # Execute the tool (may be I/O heavy — run in thread pool)
                try:
                    if tool_name in ("web_search", "extract_page"):
                        result = await loop.run_in_executor(
                            None, lambda n=tool_name, i=tool_input: execute_tool(n, i)
                        )
                    else:
                        result = execute_tool(tool_name, tool_input)
                except Exception as exc:
                    result = {"error": str(exc)}

                # ── Intercept internal tools to emit SSE events ───────────
                if tool_name == "write_section" and "error" not in result:
                    yield {
                        "type": "report_section",
                        "title": tool_input.get("title", ""),
                        "content": tool_input.get("content", ""),
                        "citations": tool_input.get("citations", []),
                    }

                elif tool_name == "mark_complete" and "error" not in result:
                    yield {
                        "type": "complete",
                        "report_title": tool_input.get("report_title", ""),
                        "executive_summary": tool_input.get("executive_summary", ""),
                    }
                    return  # Research is done — exit the loop

                # Emit a summary of the tool result (not the full content — too large)
                summary = _summarize_result(tool_name, result)
                yield {"type": "tool_result", "tool": tool_name, "result_summary": summary}

                # Build the tool_result message
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })

            # Append all tool results as a single user turn
            messages.append({"role": "user", "content": tool_results})

            # Check stop reason
            if response.stop_reason == "end_turn":
                yield {"type": "complete", "report_title": "Research Complete", "executive_summary": ""}
                return

        # Exceeded MAX_ITERATIONS
        yield {"type": "error", "message": "Research exceeded maximum iteration limit. Partial results may be available."}


def _summarize_result(tool_name: str, result: Any) -> str:
    """Create a short human-readable summary of a tool result for the SSE feed."""
    if isinstance(result, dict) and "error" in result:
        return f"Error: {result['error']}"

    if tool_name == "web_search":
        count = len(result.get("results", []))
        if count == 0:
            return "No results found."
        titles = [r["title"][:50] for r in result.get("results", [])[:3]]
        return f"Found {count} results. Top: {', '.join(titles)}"

    if tool_name == "extract_page":
        content_len = len(result.get("content", ""))
        title = result.get("title", "Untitled")[:60]
        return f"Extracted {content_len} characters from: {title}"

    if tool_name == "write_section":
        return f"Section written: {result.get('title', '')}"

    if tool_name == "mark_complete":
        return "Research marked as complete."

    return "Done."
