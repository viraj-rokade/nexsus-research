import SearchInput from "@/components/SearchInput";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-150 h-150 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-125 h-125 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 rounded-full bg-violet-500/3 blur-3xl" />
      </div>

      {/* Brand */}
      <div className="relative flex flex-col items-center gap-4 mb-12">
        {/* Logo mark */}
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
            />
          </svg>
        </div>

        {/* Name */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Nexus Research
          </h1>
          <p className="mt-3 text-base text-slate-500 max-w-md">
            AI-powered deep research. Ask anything — the agent searches, reads,
            and synthesizes a full report in real time.
          </p>
        </div>

        {/* Powered-by badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-400">
            Powered by Claude &amp; Tavily
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-2xl">
        <SearchInput />
      </div>

      {/* Footer hint */}
      <p className="relative mt-12 text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Built by Viraj Rokade with Claude AI ·
        Tavily Search · Next.js · FastAPI
      </p>
    </main>
  );
}
