"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "How does CRISPR gene editing work?",
  "What are the real causes of inflation?",
  "How does quantum computing work?",
  "What makes nuclear fusion so difficult?",
];

export default function SearchInput() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/research?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      {/* Main input */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 rounded-2xl bg-linear-to-r from-cyan-500/0 via-cyan-500/0 to-blue-500/0
          group-focus-within:from-cyan-500/30 group-focus-within:via-blue-500/20 group-focus-within:to-violet-500/30
          blur-sm transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
        <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
          group-focus-within:border-cyan-500/40 transition-colors duration-300 overflow-hidden">
          <svg
            className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300 shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything to research deeply..."
            className="w-full pl-12 pr-32 py-4 bg-transparent text-base text-white placeholder-slate-500
              focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute right-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              bg-linear-to-r from-cyan-500 to-blue-600 text-white
              hover:from-cyan-400 hover:to-blue-500 transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          >
            Research
          </button>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQuery(ex)}
            className="px-3 py-1.5 rounded-full text-xs text-slate-400 bg-white/5 border border-white/8
              hover:bg-white/10 hover:text-slate-200 hover:border-white/20
              transition-all duration-200 cursor-pointer"
          >
            {ex}
          </button>
        ))}
      </div>
    </form>
  );
}
