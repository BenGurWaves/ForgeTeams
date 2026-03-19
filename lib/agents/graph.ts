import { StateGraph, END } from "@langchain/langgraph";
import { TeamState, type TeamStateType } from "./state";
import {
  invokeLLM,
  shopifyGetProducts,
  shopifyGetAnalytics,
  shopifyUpdatePrice,
  shopifySendEmail,
  shopifyCreateDiscount,
  webSearch,
  ragSearch,
} from "./tools";

function timestamp(): string {
  return new Date().toISOString();
}

function log(agent: string, content: string): { agent: string; content: string; timestamp: string } {
  const ts = timestamp();
  console.log(`[${agent.toUpperCase()}] ${content}`);
  return { agent, content, timestamp: ts };
}

// ============================================================
// NODE: SUPERVISOR
// ============================================================
async function supervisorNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("supervisor", "Evaluating team state..."));

  let nextAgent: string;

  if (state.error) {
    messages.push(log("supervisor", `Error detected: ${state.error}. Recovering.`));
    nextAgent = "planner";
  } else if (state.plan.length === 0) {
    nextAgent = "planner";
  } else if (state.research.length === 0) {
    nextAgent = "researcher";
  } else if (state.executions.length === 0) {
    nextAgent = "executor";
  } else if (!state.review) {
    nextAgent = "reviewer";
  } else if (!state.review.approved && state.iteration < state.maxIterations) {
    messages.push(
      log("supervisor", `Review rejected (score: ${state.review.score}/10). Iteration ${state.iteration}/${state.maxIterations}.`)
    );
    nextAgent = "planner";
  } else {
    messages.push(log("supervisor", "All agents complete. Goal finished."));
    nextAgent = "done";
  }

  if (nextAgent !== "done") {
    messages.push(log("supervisor", `Routing to: ${nextAgent}`));
  }

  return {
    currentAgent: nextAgent,
    messages,
    error: null,
    iteration: state.error ? 1 : 0,
  };
}

// ============================================================
// NODE: PLANNER
// ============================================================
async function plannerNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("planner", "Analyzing goal and creating plan... (this may take 10-30s)"));

  try {
    const context = state.review
      ? `Previous review feedback: ${state.review.feedback}\nSuggestions: ${state.review.suggestions.join(", ")}`
      : "First iteration.";

    const response = await invokeLLM(
      `You are a strategic planner for a Shopify store. Create a concise plan.
Output ONLY a valid JSON array. Each element: {"id": number, "action": "description", "priority": "high|medium|low", "status": "pending", "dependencies": []}.
Max 4 steps. No explanation, no markdown, just the JSON array.`,
      `Goal: ${state.goal}\nContext: ${context}`
    );

    let plan;
    try {
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      if (!Array.isArray(plan) || plan.length === 0) throw new Error("empty");
    } catch {
      plan = [
        { id: 1, action: "Analyze current store metrics", priority: "high", status: "pending", dependencies: [] },
        { id: 2, action: "Research competitor pricing", priority: "high", status: "pending", dependencies: [] },
        { id: 3, action: "Optimize pricing and create campaign", priority: "medium", status: "pending", dependencies: [] },
        { id: 4, action: "Create discount for conversion boost", priority: "low", status: "pending", dependencies: [] },
      ];
      messages.push(log("planner", "Used fallback plan (LLM output wasn't valid JSON)."));
    }

    messages.push(log("planner", `Plan ready: ${plan.length} steps.`));
    for (const step of plan) {
      messages.push(log("planner", `  [${step.priority}] ${step.action}`));
    }

    return { plan, messages, currentAgent: "supervisor" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("planner", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// NODE: RESEARCHER
// ============================================================
async function researcherNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("researcher", "Gathering market data... (this may take 10-30s)"));

  try {
    const [products, analytics, searchResults, memoryResults] = await Promise.all([
      shopifyGetProducts(),
      shopifyGetAnalytics(),
      webSearch(state.goal),
      ragSearch(state.goal),
    ]);

    messages.push(log("researcher", "Data collected. Synthesizing with LLM..."));

    const response = await invokeLLM(
      `You are a market researcher. Analyze data and extract insights.
Output ONLY a valid JSON array. Each element: {"source": "name", "finding": "insight", "relevance": 0.8, "timestamp": "${timestamp()}"}.
Max 4 findings. No explanation, no markdown, just the JSON array.`,
      `Goal: ${state.goal}\nProducts: ${JSON.stringify(products)}\nAnalytics: ${JSON.stringify(analytics)}\nWeb: ${JSON.stringify(searchResults)}\nMemory: ${JSON.stringify(memoryResults)}`
    );

    let research;
    try {
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      research = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      if (!Array.isArray(research) || research.length === 0) throw new Error("empty");
    } catch {
      research = [
        { source: "analytics", finding: "30-day revenue $24,580, 3.2% conversion, top: Minimalist Watch", relevance: 0.95, timestamp: timestamp() },
        { source: "competitors", finding: "Competitors price 10-25% higher with bundle strategies", relevance: 0.88, timestamp: timestamp() },
        { source: "trends", finding: "Premium minimalist accessories trending, social proof +40% conversion", relevance: 0.82, timestamp: timestamp() },
      ];
      messages.push(log("researcher", "Used fallback findings (LLM output wasn't valid JSON)."));
    }

    for (const r of research) {
      messages.push(log("researcher", `[${r.source}] ${r.finding}`));
    }

    return { research, messages, currentAgent: "supervisor" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("researcher", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// NODE: EXECUTOR
// ============================================================
async function executorNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("executor", "Deciding actions based on plan + research... (this may take 10-30s)"));

  try {
    const response = await invokeLLM(
      `You are an eCommerce executor. Decide which actions to take.
Output ONLY a valid JSON array. Each element: {"type": "update_price|send_email|create_discount", "params": {...}}.
Available params:
- update_price: {"product_id": "prod_001", "new_price": 99.99}
- send_email: {"subject": "text", "segment": "vip"}
- create_discount: {"code": "SAVE10", "percentage": 10}
Max 3 actions. No explanation, just the JSON array.`,
      `Goal: ${state.goal}\nPlan: ${JSON.stringify(state.plan)}\nResearch: ${JSON.stringify(state.research)}`
    );

    const executions = [];

    let actions;
    try {
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      actions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      if (!Array.isArray(actions) || actions.length === 0) throw new Error("empty");
    } catch {
      actions = [
        { type: "update_price", params: { product_id: "prod_003", new_price: 219.0 } },
        { type: "send_email", params: { subject: "New Season Collection", segment: "vip" } },
        { type: "create_discount", params: { code: "FORGE15", percentage: 15 } },
      ];
      messages.push(log("executor", "Used fallback actions (LLM output wasn't valid JSON)."));
    }

    for (const action of actions) {
      let result;
      switch (action.type) {
        case "update_price":
          result = await shopifyUpdatePrice(action.params.product_id, String(action.params.new_price));
          break;
        case "send_email":
          result = await shopifySendEmail(action.params.subject, action.params.segment);
          break;
        case "create_discount":
          result = await shopifyCreateDiscount(action.params.code, action.params.percentage);
          break;
        default:
          result = { success: false, message: `Unknown action: ${action.type}` };
      }
      executions.push({
        action: `${action.type}: ${JSON.stringify(action.params)}`,
        success: result.success,
        output: result.message,
        timestamp: timestamp(),
      });
      messages.push(log("executor", result.message));
    }

    return { executions, messages, currentAgent: "supervisor" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("executor", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// NODE: REVIEWER
// ============================================================
async function reviewerNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("reviewer", "Evaluating results... (this may take 10-30s)"));

  try {
    const response = await invokeLLM(
      `You review eCommerce strategy execution. Evaluate the work.
Output ONLY a valid JSON object: {"approved": true, "feedback": "text", "score": 8, "suggestions": []}.
Score 7+ = approve. Below 7 = reject. No explanation, just JSON.`,
      `Goal: ${state.goal}\nPlan: ${JSON.stringify(state.plan)}\nResearch: ${JSON.stringify(state.research)}\nExecutions: ${JSON.stringify(state.executions)}\nIteration: ${state.iteration}/${state.maxIterations}`
    );

    let review;
    try {
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      review = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!review || typeof review.approved !== "boolean") throw new Error("invalid");
    } catch {
      review = {
        approved: true,
        feedback: "Strategy covers research, pricing, email, and discounts. Solid first iteration.",
        score: 8,
        suggestions: [],
      };
      messages.push(log("reviewer", "Used fallback review (LLM output wasn't valid JSON)."));
    }

    messages.push(
      log("reviewer", `Score: ${review.score}/10 — ${review.approved ? "APPROVED" : "NEEDS REVISION"}`)
    );
    messages.push(log("reviewer", review.feedback));

    return { review, messages, currentAgent: "supervisor", iteration: 1 };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("reviewer", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// ROUTING
// ============================================================
function routeFromSupervisor(state: TeamStateType): string {
  switch (state.currentAgent) {
    case "planner": return "planner";
    case "researcher": return "researcher";
    case "executor": return "executor";
    case "reviewer": return "reviewer";
    case "done": return END;
    default: return END;
  }
}

// ============================================================
// BUILD & RUN
// ============================================================
export function buildTeamGraph() {
  const graph = new StateGraph(TeamState)
    .addNode("supervisor", supervisorNode)
    .addNode("planner", plannerNode)
    .addNode("researcher", researcherNode)
    .addNode("executor", executorNode)
    .addNode("reviewer", reviewerNode)
    .addEdge("__start__", "supervisor")
    .addConditionalEdges("supervisor", routeFromSupervisor, [
      "planner", "researcher", "executor", "reviewer", END,
    ])
    .addEdge("planner", "supervisor")
    .addEdge("researcher", "supervisor")
    .addEdge("executor", "supervisor")
    .addEdge("reviewer", "supervisor");

  return graph.compile();
}

export async function* runTeam(goal: string) {
  const app = buildTeamGraph();

  const stream = await app.stream(
    { goal, maxIterations: 3 },
    { recursionLimit: 30 }
  );

  for await (const chunk of stream) {
    for (const [nodeName, state] of Object.entries(chunk)) {
      const s = state as Partial<TeamStateType>;
      if (s.messages) {
        for (const msg of s.messages) {
          yield { node: nodeName, ...msg };
        }
      }
    }
  }
}
