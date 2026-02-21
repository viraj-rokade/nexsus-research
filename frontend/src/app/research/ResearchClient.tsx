"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useResearch } from "@/lib/useResearch";
import { useResearchStore } from "@/lib/store";
import AgentTimeline from "@/components/AgentTimeline";
import ReportViewer from "@/components/ReportViewer";

interface Props {
  initialQuery: string;
}

export default function ResearchClient({ initialQuery }: Props) {
  const { startResearch } = useResearch();
  const { status, sections, error } = useResearchStore();
  const router = useRouter();
  const started = useRef(false);
  const [timelineOpen, setTimelineOpen] = useState(true);

  // Start research once on mount
  useEffect(() => {
    if (started.current || !initialQuery) return;
    started.current = true;
    startResearch(initialQuery);
  }, [initialQuery, startResearch]);

  // Progress: each section = step, mark_complete = final
  const totalExpected = 6;
  const progress =
    status === "complete"
      ? 100
      : status === "streaming"
      ? Math.min(90, (sections.length / totalExpected) * 85 + 5)
      : status === "loading"
      ? 3
      : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#080d18]/80 backdrop-blur-sm">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs font-medium hidden sm:inline">Back</span>
        </button>

        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Brand */}
        <span className="text-sm font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent shrink-0">
          Nexus
        </span>

        {/* Query pill */}
        <div className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
          <p className="text-xs text-slate-300 truncate">{initialQuery}</p>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {status === "loading" && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Starting
            </span>
          )}
          {status === "streaming" && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Researching
            </span>
          )}
          {status === "complete" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Done
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Error
            </span>
          )}
        </div>
      </header>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div
          className="h-full bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {status === "error" && error && (
        <div className="shrink-0 flex items-start gap-3 px-4 py-3 bg-red-500/10 border-b border-red-500/20">
          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-300 leading-relaxed font-mono">{error}</p>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}

      {/* Desktop: two-column layout */}
      <div className="hidden md:flex flex-1 overflow-hidden divide-x divide-white/5">
        {/* Left: Agent activity (38%) */}
        <div className="w-[38%] overflow-hidden bg-[#080d18]">
          <AgentTimeline />
        </div>
        {/* Right: Report (62%) */}
        <div className="flex-1 overflow-hidden bg-[#060b14]">
          <ReportViewer />
        </div>
      </div>

      {/* Mobile: stacked, timeline collapsible */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Timeline accordion */}
        <div className="shrink-0 border-b border-white/5">
          <button
            onClick={() => setTimelineOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest"
          >
            <span className="flex items-center gap-2">
              {status === "streaming" && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
              Agent Activity
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${timelineOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {timelineOpen && (
            <div className="max-h-48 overflow-hidden bg-[#080d18]">
              <AgentTimeline />
            </div>
          )}
        </div>

        {/* Report takes remaining space */}
        <div className="flex-1 overflow-hidden bg-[#060b14]">
          <ReportViewer />
        </div>
      </div>
    </div>
  );
}
