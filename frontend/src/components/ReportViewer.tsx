"use client";
import { useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useResearchStore } from "@/lib/store";
import CitationBadge from "./CitationBadge";

// ── Icons ────────────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

function buildMarkdown(
  reportTitle: string,
  executiveSummary: string,
  sections: { title: string; content: string; citations: { url: string; title: string }[] }[]
): string {
  const lines: string[] = [`# ${reportTitle}`, ""];
  if (executiveSummary) {
    lines.push(`> ${executiveSummary}`, "");
  }
  for (const sec of sections) {
    lines.push(`## ${sec.title}`, "", sec.content, "");
    if (sec.citations.length > 0) {
      lines.push("**Sources:**");
      sec.citations.forEach((c) => lines.push(`- [${c.title}](${c.url})`));
      lines.push("");
    }
  }
  return lines.join("\n");
}

export default function ReportViewer() {
  const { sections, status, executiveSummary, reportTitle } = useResearchStore();

  const handleCopy = useCallback(() => {
    const md = buildMarkdown(reportTitle, executiveSummary, sections);
    navigator.clipboard.writeText(md).catch(() => {});
  }, [reportTitle, executiveSummary, sections]);

  const handleDownload = useCallback(() => {
    const md = buildMarkdown(reportTitle, executiveSummary, sections);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "research-report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reportTitle, executiveSummary, sections]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest truncate">
            Research Report
          </h2>
        </div>
        {sections.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-white/5 border border-white/10 text-slate-300
                hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <CopyIcon /> Copy
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-cyan-500/10 border border-cyan-500/20 text-cyan-300
                hover:bg-cyan-500/20 hover:text-cyan-200 transition-all duration-200"
            >
              <DownloadIcon /> .md
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

        {/* Empty state */}
        {sections.length === 0 && status !== "complete" && (
          <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
            {status === "idle" ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">Report will appear here as sections are written</p>
              </>
            ) : (
              <div className="space-y-3 w-full">
                {[0.8, 0.6, 0.9, 0.5].map((w, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-4 rounded bg-white/5 animate-pulse" style={{ width: `${w * 60 + 20}%` }} />
                    <div className="h-3 rounded bg-white/[0.03] animate-pulse" style={{ width: `${w * 80 + 10}%` }} />
                    <div className="h-3 rounded bg-white/[0.03] animate-pulse" style={{ width: `${w * 70 + 15}%` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Executive summary */}
        {status === "complete" && executiveSummary && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 animate-fade-in-up">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">
              Executive Summary
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">{executiveSummary}</p>
          </div>
        )}

        {/* Report title */}
        {(reportTitle && sections.length > 0) && (
          <h1 className="text-xl font-bold text-white leading-snug animate-fade-in-up">
            {reportTitle}
          </h1>
        )}

        {/* Sections */}
        {sections.map((sec, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-3 animate-fade-in-up"
          >
            <h2 className="text-base font-semibold text-white">{sec.title}</h2>
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-slate-200 prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-slate-300 prose-strong:text-white prose-a:text-cyan-400
              prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
              prose-blockquote:border-l-cyan-500 prose-blockquote:text-slate-400">
              <Markdown remarkPlugins={[remarkGfm]}>{sec.content}</Markdown>
            </div>
            {sec.citations.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {sec.citations.map((c, j) => (
                    <CitationBadge key={j} citation={c} index={j} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
