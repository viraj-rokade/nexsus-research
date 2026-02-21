// All SSE event types the backend can emit

export interface Citation {
  url: string;
  title: string;
}

export interface AgentThinkingEvent {
  type: "agent_thinking";
  content: string;
}

export interface ToolCallEvent {
  type: "tool_call";
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolResultEvent {
  type: "tool_result";
  tool: string;
  result_summary: string;
}

export interface ReportSectionEvent {
  type: "report_section";
  title: string;
  content: string;
  citations: Citation[];
}

export interface CompleteEvent {
  type: "complete";
  report_title: string;
  executive_summary: string;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export interface StreamEndEvent {
  type: "stream_end";
}

export type AgentEvent =
  | AgentThinkingEvent
  | ToolCallEvent
  | ToolResultEvent
  | ReportSectionEvent
  | CompleteEvent
  | ErrorEvent
  | StreamEndEvent;
