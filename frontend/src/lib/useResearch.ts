"use client";
import { useCallback, useRef } from "react";
import { useResearchStore } from "./store";
import type { AgentEvent, ReportSectionEvent } from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useResearch() {
  const store = useResearchStore();
  const esRef = useRef<EventSource | null>(null);

  const startResearch = useCallback(
    async (query: string) => {
      // Close any existing stream
      esRef.current?.close();

      store.reset();
      store.setQuery(query);
      store.setStatus("loading");

      try {
        // Start the research job
        const res = await fetch(`${BACKEND_URL}/api/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Unknown error" }));
          store.setError(err.detail || "Failed to start research");
          return;
        }

        const data = await res.json();
        const researchId: string = data.research_id;
        store.setResearchId(researchId);
        store.setStatus("streaming");

        // Open SSE stream
        const es = new EventSource(
          `${BACKEND_URL}/api/research/${researchId}/stream`
        );
        esRef.current = es;

        es.onmessage = (e: MessageEvent) => {
          try {
            const event: AgentEvent = JSON.parse(e.data as string);
            store.addEvent(event);

            if (event.type === "report_section") {
              store.addSection(event as ReportSectionEvent);
            } else if (event.type === "complete") {
              store.setComplete(event.report_title, event.executive_summary);
              es.close();
            } else if (event.type === "error") {
              store.setError(event.message);
              es.close();
            } else if (event.type === "stream_end") {
              if (store.status !== "complete") {
                store.setStatus("complete");
              }
              es.close();
            }
          } catch {
            // skip parse errors
          }
        };

        es.onerror = () => {
          if (
            store.status !== "complete" &&
            store.status !== "error"
          ) {
            store.setError("Connection to research stream lost.");
          }
          es.close();
        };
      } catch (err) {
        store.setError(
          err instanceof Error ? err.message : "Network error"
        );
      }
    },
    [store]
  );

  return { startResearch };
}
