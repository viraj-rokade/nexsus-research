"use client";
import type { AgentEvent } from "@/lib/types";

// ── Icons ─────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
);
const FileIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const BrainIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const ResultIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

interface Props {
  event: AgentEvent;
}

export default function ToolCallCard({ event }: Props) {
  if (event.type === "agent_thinking") {
    return (
      <div className="flex gap-2.5 items-start animate-fade-in-up">
        <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/60 text-slate-400 shrink-0">
          <BrainIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 italic leading-relaxed">{event.content}</p>
        </div>
        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse shrink-0" />
      </div>
    );
  }

  if (event.type === "tool_call") {
    const { tool, input } = event;

    if (tool === "web_search") {
      const query = (input as { query: string }).query;
      return (
        <div className="flex gap-2.5 items-start animate-fade-in-up">
          <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 shrink-0">
            <SearchIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-0.5">Searching web</p>
            <p className="text-xs text-slate-200 truncate">&ldquo;{query}&rdquo;</p>
          </div>
        </div>
      );
    }

    if (tool === "extract_page") {
      const url = (input as { url: string }).url;
      let domain = url;
      try { domain = new URL(url).hostname.replace("www.", ""); } catch { /* noop */ }
      return (
        <div className="flex gap-2.5 items-start animate-fade-in-up">
          <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 shrink-0">
            <FileIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-0.5">Reading page</p>
            <p className="text-xs text-slate-300 truncate">{domain}</p>
          </div>
        </div>
      );
    }

    if (tool === "write_section") {
      const title = (input as { title: string }).title;
      return (
        <div className="flex gap-2.5 items-start animate-fade-in-up">
          <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
            <PencilIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5">Writing section</p>
            <p className="text-xs text-slate-200 truncate">{title}</p>
          </div>
        </div>
      );
    }

    if (tool === "mark_complete") {
      return (
        <div className="flex gap-2.5 items-start animate-fade-in-up">
          <div className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 shrink-0">
            <CheckIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-cyan-300">Research complete</p>
          </div>
        </div>
      );
    }
  }

  if (event.type === "tool_result") {
    return (
      <div className="flex gap-2.5 items-start pl-8 animate-fade-in-up">
        <div className="mt-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-slate-700/40 text-slate-500 shrink-0">
          <ResultIcon />
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{event.result_summary}</p>
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="flex gap-2.5 items-start animate-fade-in-up rounded-lg bg-red-500/10 border border-red-500/20 p-3">
        <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-[11px] text-red-300 font-mono leading-relaxed break-all">{event.message}</p>
      </div>
    );
  }

  return null;
}
