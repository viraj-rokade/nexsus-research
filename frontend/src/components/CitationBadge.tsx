"use client";
import type { Citation } from "@/lib/types";

interface CitationBadgeProps {
  citation: Citation;
  index: number;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.slice(0, 30);
  }
}

export default function CitationBadge({ citation, index }: CitationBadgeProps) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      title={citation.title}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        bg-white/5 border border-white/10 text-slate-300
        hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:text-cyan-300
        transition-all duration-200 cursor-pointer"
    >
      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[9px] font-bold shrink-0">
        {index + 1}
      </span>
      <span className="max-w-[140px] truncate">{getDomain(citation.url)}</span>
      <svg
        className="w-3 h-3 text-slate-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}
