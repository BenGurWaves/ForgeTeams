import { z } from "zod";
import { Annotation } from "@langchain/langgraph";

// Zod schemas for runtime validation
export const PlanStepSchema = z.object({
  id: z.number(),
  action: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  dependencies: z.array(z.number()).default([]),
});

export const ResearchFindingSchema = z.object({
  source: z.string(),
  finding: z.string(),
  relevance: z.number().min(0).max(1),
  timestamp: z.string(),
});

export const ExecutionResultSchema = z.object({
  action: z.string(),
  success: z.boolean(),
  output: z.string(),
  timestamp: z.string(),
});

export const ReviewFeedbackSchema = z.object({
  approved: z.boolean(),
  feedback: z.string(),
  score: z.number().min(0).max(10),
  suggestions: z.array(z.string()).default([]),
});

// LangGraph annotation — defines the shared state shape and reducers
export const TeamState = Annotation.Root({
  // User's original goal
  goal: Annotation<string>({ reducer: (_, v) => v, default: () => "" }),

  // Current plan (set by Planner)
  plan: Annotation<z.infer<typeof PlanStepSchema>[]>({
    reducer: (_, v) => v,
    default: () => [],
  }),

  // Research findings (appended by Researcher)
  research: Annotation<z.infer<typeof ResearchFindingSchema>[]>({
    reducer: (prev, v) => [...prev, ...v],
    default: () => [],
  }),

  // Execution results (appended by Executor)
  executions: Annotation<z.infer<typeof ExecutionResultSchema>[]>({
    reducer: (prev, v) => [...prev, ...v],
    default: () => [],
  }),

  // Latest review (set by Reviewer)
  review: Annotation<z.infer<typeof ReviewFeedbackSchema> | null>({
    reducer: (_, v) => v,
    default: () => null,
  }),

  // Iteration tracking
  iteration: Annotation<number>({
    reducer: (prev, v) => prev + v,
    default: () => 0,
  }),

  maxIterations: Annotation<number>({
    reducer: (_, v) => v,
    default: () => 5,
  }),

  // Current active agent
  currentAgent: Annotation<string>({
    reducer: (_, v) => v,
    default: () => "supervisor",
  }),

  // Agent message log for streaming
  messages: Annotation<Array<{ agent: string; content: string; timestamp: string }>>({
    reducer: (prev, v) => [...prev, ...v],
    default: () => [],
  }),

  // Error tracking
  error: Annotation<string | null>({
    reducer: (_, v) => v,
    default: () => null,
  }),

  // Final status
  status: Annotation<"running" | "completed" | "failed">({
    reducer: (_, v) => v,
    default: () => "running",
  }),
});

export type TeamStateType = typeof TeamState.State;
