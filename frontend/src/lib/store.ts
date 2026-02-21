import { create } from "zustand";
import type { AgentEvent, ReportSectionEvent } from "./types";

export type ResearchStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";

interface ResearchState {
  query: string;
  researchId: string | null;
  status: ResearchStatus;
  events: AgentEvent[];
  sections: ReportSectionEvent[];
  executiveSummary: string;
  reportTitle: string;
  error: string | null;

  setQuery: (q: string) => void;
  setResearchId: (id: string) => void;
  setStatus: (s: ResearchStatus) => void;
  addEvent: (e: AgentEvent) => void;
  addSection: (s: ReportSectionEvent) => void;
  setComplete: (title: string, summary: string) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useResearchStore = create<ResearchState>()((set) => ({
  query: "",
  researchId: null,
  status: "idle",
  events: [],
  sections: [],
  executiveSummary: "",
  reportTitle: "",
  error: null,

  setQuery: (query) => set({ query }),
  setResearchId: (researchId) => set({ researchId }),
  setStatus: (status) => set({ status }),
  addEvent: (e) => set((s) => ({ events: [...s.events, e] })),
  addSection: (section) => set((s) => ({ sections: [...s.sections, section] })),
  setComplete: (reportTitle, executiveSummary) =>
    set({ reportTitle, executiveSummary, status: "complete" }),
  setError: (error) => set({ error, status: "error" }),
  reset: () =>
    set({
      researchId: null,
      status: "idle",
      events: [],
      sections: [],
      executiveSummary: "",
      reportTitle: "",
      error: null,
    }),
}));
