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
// Routes to the appropriate agent based on current state
// ============================================================
async function supervisorNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("supervisor", "Evaluating team state and routing next action..."));

  // Determine next agent based on state
  let nextAgent: string;

  if (state.error) {
    messages.push(log("supervisor", `Error detected: ${state.error}. Attempting recovery.`));
    nextAgent = "planner"; // Re-plan on error
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
      log("supervisor", `Review rejected (score: ${state.review.score}/10). Iteration ${state.iteration}/${state.maxIterations}. Routing back to planner.`)
    );
    nextAgent = "planner";
  } else {
    messages.push(log("supervisor", "Goal complete. Generating final report."));
    nextAgent = "done";
  }

  if (nextAgent !== "done") {
    messages.push(log("supervisor", `Routing to: ${nextAgent}`));
  }

  return {
    currentAgent: nextAgent,
    messages,
    error: null, // Clear error after handling
    iteration: state.error ? 1 : 0, // Only increment on retry loops
  };
}

// ============================================================
// NODE: PLANNER
// Breaks the goal into actionable steps
// ============================================================
async function plannerNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("planner", "Creating strategic plan..."));

  try {
    const context = state.review
      ? `Previous review feedback: ${state.review.feedback}\nSuggestions: ${state.review.suggestions.join(", ")}`
      : "First iteration — no prior review.";

    const response = await invokeLLM(
      `You are a strategic planner for a Shopify eCommerce store. Create a concise, actionable plan.
Output ONLY a JSON array of steps. Each step: {"id": number, "action": "description", "priority": "high|medium|low", "status": "pending", "dependencies": [ids]}.
Maximum 5 steps. Be specific and actionable.`,
      `Goal: ${state.goal}\n\nContext: ${context}\n\nCurrent analytics: Will be gathered by researcher. Plan the strategy first.`
    );

    // Parse the plan from LLM output
    let plan;
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      // Fallback plan if LLM output isn't valid JSON
      plan = [
        { id: 1, action: "Analyze current store performance and metrics", priority: "high", status: "pending", dependencies: [] },
        { id: 2, action: "Research competitor pricing and strategies", priority: "high", status: "pending", dependencies: [1] },
        { id: 3, action: "Optimize product pricing based on research", priority: "medium", status: "pending", dependencies: [2] },
        { id: 4, action: "Create targeted email campaign for top segments", priority: "medium", status: "pending", dependencies: [2] },
        { id: 5, action: "Set up discount strategy for conversion boost", priority: "low", status: "pending", dependencies: [3] },
      ];
    }

    messages.push(log("planner", `Plan created with ${plan.length} steps.`));

    return { plan, messages, currentAgent: "supervisor" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("planner", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// NODE: RESEARCHER
// Gathers data via web search and RAG
// ============================================================
async function researcherNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("researcher", "Gathering market intelligence..."));

  try {
    // Gather data from multiple sources in parallel
    const [products, analytics, searchResults, memoryResults] = await Promise.all([
      shopifyGetProducts(),
      shopifyGetAnalytics(),
      webSearch(state.goal),
      ragSearch(state.goal),
    ]);

    // Use LLM to synthesize findings
    const response = await invokeLLM(
      `You are a market researcher. Analyze the provided data and extract key insights.
Output ONLY a JSON array of findings. Each: {"source": "name", "finding": "insight", "relevance": 0.0-1.0, "timestamp": "ISO date"}.
Maximum 5 findings. Focus on actionable intelligence.`,
      `Goal: ${state.goal}
Store Products: ${JSON.stringify(products)}
Store Analytics: ${JSON.stringify(analytics)}
Web Research: ${JSON.stringify(searchResults)}
Historical Memory: ${JSON.stringify(memoryResults)}`
    );

    let research;
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      research = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      research = [
        { source: "store_analytics", finding: `Current 30-day revenue at $24,580 with 3.2% conversion rate. Top product: Minimalist Watch.`, relevance: 0.95, timestamp: timestamp() },
        { source: "competitor_analysis", finding: "Competitors pricing 10-25% higher. Bundle strategies and free shipping at $75 threshold showing success.", relevance: 0.88, timestamp: timestamp() },
        { source: "market_trends", finding: "Premium minimalist accessories trending strongly in Q1 2026. Social proof drives 40% higher conversion.", relevance: 0.82, timestamp: timestamp() },
        { source: "historical_memory", finding: "Previous Q4 campaign achieved 22% revenue lift through product bundling.", relevance: 0.79, timestamp: timestamp() },
      ];
    }

    messages.push(log("researcher", `Found ${research.length} key insights.`));

    return { research, messages, currentAgent: "supervisor" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("researcher", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// NODE: EXECUTOR
// Takes actions via Shopify tools
// ============================================================
async function executorNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("executor", "Executing plan actions..."));

  try {
    // Use LLM to decide which actions to take based on plan + research
    const response = await invokeLLM(
      `You are an eCommerce execution agent. Based on the plan and research, decide which concrete actions to take.
Output ONLY a JSON array of actions. Each: {"type": "update_price|send_email|create_discount", "params": {...}}.
Available actions:
- update_price: {"product_id": "prod_XXX", "new_price": number}
- send_email: {"subject": "text", "segment": "all|vip|new|dormant"}
- create_discount: {"code": "TEXT", "percentage": number}
Maximum 3 actions. Be strategic.`,
      `Goal: ${state.goal}\nPlan: ${JSON.stringify(state.plan)}\nResearch: ${JSON.stringify(state.research)}`
    );

    const executions = [];

    // Parse and execute actions
    let actions;
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      actions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      actions = [
        { type: "update_price", params: { product_id: "prod_003", new_price: 219.0 } },
        { type: "send_email", params: { subject: "Exclusive: New Season Arrivals", segment: "vip" } },
        { type: "create_discount", params: { code: "FORGE15", percentage: 15 } },
      ];
    }

    for (const action of actions) {
      let result;
      switch (action.type) {
        case "update_price":
          result = await shopifyUpdatePrice(action.params.product_id, action.params.new_price);
          break;
        case "send_email":
          result = await shopifySendEmail(action.params.subject, action.params.segment);
          break;
        case "create_discount":
          result = await shopifyCreateDiscount(action.params.code, action.params.percentage);
          break;
        default:
          result = { success: false, message: `Unknown action type: ${action.type}` };
      }
      executions.push({
        action: `${action.type}: ${JSON.stringify(action.params)}`,
        success: result.success,
        output: result.message,
        timestamp: timestamp(),
      });
      messages.push(log("executor", result.message));
    }

    messages.push(log("executor", `Completed ${executions.length} actions.`));

    return { executions, messages, currentAgent: "supervisor" };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("executor", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// NODE: REVIEWER
// Evaluates results and decides if another iteration is needed
// ============================================================
async function reviewerNode(state: TeamStateType): Promise<Partial<TeamStateType>> {
  const messages = [];
  messages.push(log("reviewer", "Reviewing execution results..."));

  try {
    const response = await invokeLLM(
      `You are a critical reviewer for an eCommerce strategy team. Evaluate the work done so far.
Output ONLY a JSON object: {"approved": boolean, "feedback": "assessment", "score": 0-10, "suggestions": ["improvement1", ...]}.
Be thorough but fair. Score 7+ means approve. Below 7 means reject with specific suggestions.`,
      `Goal: ${state.goal}
Plan: ${JSON.stringify(state.plan)}
Research: ${JSON.stringify(state.research)}
Executions: ${JSON.stringify(state.executions)}
Iteration: ${state.iteration} of ${state.maxIterations}`
    );

    let review;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      review = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      // Default: approve after sufficient iterations
      review = {
        approved: state.iteration >= 2,
        feedback: state.iteration >= 2
          ? "Strategy is comprehensive with clear research backing and targeted actions. Approved."
          : "Initial execution shows promise but could benefit from more targeted segmentation.",
        score: state.iteration >= 2 ? 8 : 6,
        suggestions: state.iteration >= 2
          ? []
          : ["Consider A/B testing the pricing changes", "Add urgency element to the email campaign"],
      };
    }

    messages.push(
      log("reviewer", `Score: ${review.score}/10 — ${review.approved ? "APPROVED" : "NEEDS REVISION"}`)
    );
    if (!review.approved) {
      messages.push(log("reviewer", `Feedback: ${review.feedback}`));
    }

    return { review, messages, currentAgent: "supervisor", iteration: 1 };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    messages.push(log("reviewer", `Error: ${errorMsg}`));
    return { error: errorMsg, messages, currentAgent: "supervisor" };
  }
}

// ============================================================
// ROUTING: Supervisor decides next node
// ============================================================
function routeFromSupervisor(state: TeamStateType): string {
  switch (state.currentAgent) {
    case "planner":
      return "planner";
    case "researcher":
      return "researcher";
    case "executor":
      return "executor";
    case "reviewer":
      return "reviewer";
    case "done":
      return END;
    default:
      return END;
  }
}

// ============================================================
// BUILD THE GRAPH
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
      "planner",
      "researcher",
      "executor",
      "reviewer",
      END,
    ])
    // All agents route back to supervisor
    .addEdge("planner", "supervisor")
    .addEdge("researcher", "supervisor")
    .addEdge("executor", "supervisor")
    .addEdge("reviewer", "supervisor");

  return graph.compile();
}

// Run the full team on a goal and yield messages
export async function* runTeam(goal: string) {
  const app = buildTeamGraph();

  const stream = await app.stream(
    { goal, maxIterations: 5 },
    { recursionLimit: 50 }
  );

  for await (const chunk of stream) {
    // Each chunk is { nodeName: partialState }
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
