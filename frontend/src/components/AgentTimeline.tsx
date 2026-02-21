"use client";
import { useEffect, useRef } from "react";
import { useResearchStore } from "@/lib/store";
import ToolCallCard from "./ToolCallCard";

export default function AgentTimeline() {
  const { events, status } = useResearchStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new events arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const displayEvents = events.filter((e) => e.type !== "stream_end");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <span className="w-2 h-2 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-widest">
          Agent Activity
        </span>
        {status === "streaming" && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live
          </span>
        )}
        {status === "complete" && (
          <span className="ml-auto text-[10px] text-emerald-400 font-medium">Done</span>
        )}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {displayEvents.length === 0 && status === "loading" && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
            <p className="text-xs text-slate-500">Starting research...</p>
          </div>
        )}

        {displayEvents.map((event, i) => (
          <ToolCallCard key={i} event={event} />
        ))}

        {/* Streaming cursor */}
        {status === "streaming" && (
          <div className="flex items-center gap-1.5 pl-8">
            <span className="w-1 h-3.5 bg-cyan-400 animate-pulse rounded-sm" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
