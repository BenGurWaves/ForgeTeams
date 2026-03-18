import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Ollama LLM — default local dev model
export function createLLM(model?: string, baseUrl?: string) {
  return new ChatOllama({
    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    model: model || process.env.OLLAMA_MODEL || "qwen3-coder:latest",
    temperature: 0.3,
  });
}

// Output parser
const outputParser = new StringOutputParser();

// Helper: invoke LLM with a system prompt and user message
export async function invokeLLM(
  systemPrompt: string,
  userMessage: string,
  model?: string
): Promise<string> {
  const llm = createLLM(model);
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", "{input}"],
  ]);
  const chain = prompt.pipe(llm).pipe(outputParser);
  return chain.invoke({ input: userMessage });
}

// ============================================================
// SHOPIFY STUB TOOLS
// These return mock data. Replace with real Shopify API calls later.
// ============================================================

export async function shopifyGetProducts(): Promise<object[]> {
  return [
    { id: "prod_001", title: "Premium Leather Wallet", price: 89.99, inventory: 142 },
    { id: "prod_002", title: "Canvas Tote Bag", price: 45.00, inventory: 78 },
    { id: "prod_003", title: "Minimalist Watch", price: 199.00, inventory: 34 },
    { id: "prod_004", title: "Merino Wool Scarf", price: 65.00, inventory: 201 },
    { id: "prod_005", title: "Titanium Keychain", price: 32.00, inventory: 89 },
  ];
}

export async function shopifyUpdatePrice(
  productId: string,
  newPrice: number
): Promise<{ success: boolean; message: string }> {
  // Stub: log and return success
  console.log(`[STUB] Updating price for ${productId} to $${newPrice}`);
  return {
    success: true,
    message: `Price for ${productId} updated to $${newPrice.toFixed(2)} (stub)`,
  };
}

export async function shopifyGetAnalytics(): Promise<object> {
  return {
    revenue_30d: 24580.0,
    orders_30d: 187,
    avg_order_value: 131.44,
    conversion_rate: 0.032,
    top_product: "Minimalist Watch",
    traffic_sources: {
      organic: 45,
      direct: 28,
      social: 18,
      email: 9,
    },
  };
}

export async function shopifySendEmail(
  subject: string,
  segment: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[STUB] Sending email "${subject}" to segment: ${segment}`);
  return {
    success: true,
    message: `Email "${subject}" queued for ${segment} segment (stub)`,
  };
}

export async function shopifyCreateDiscount(
  code: string,
  percentage: number
): Promise<{ success: boolean; message: string }> {
  console.log(`[STUB] Creating discount ${code} for ${percentage}%`);
  return {
    success: true,
    message: `Discount ${code} (${percentage}% off) created (stub)`,
  };
}

// ============================================================
// RESEARCH STUB TOOLS
// ============================================================

export async function webSearch(query: string): Promise<object[]> {
  // Stub: returns mock search results
  console.log(`[STUB] Web search: "${query}"`);
  return [
    {
      title: `Market analysis: ${query}`,
      snippet: "Industry data suggests 15-20% growth in premium ecommerce segments. Price sensitivity decreasing for quality-focused brands.",
      url: "https://example.com/market-report",
    },
    {
      title: `Competitor pricing for ${query}`,
      snippet: "Top competitors pricing similar items 10-25% higher with bundle strategies. Free shipping threshold at $75 appears optimal.",
      url: "https://example.com/competitor-data",
    },
    {
      title: `Consumer trends: ${query}`,
      snippet: "Q1 2026 shows strong demand for minimalist accessories. Social proof and limited editions driving 40% higher conversion.",
      url: "https://example.com/trends",
    },
  ];
}

export async function ragSearch(
  query: string,
  _userId?: string
): Promise<object[]> {
  // Stub: would search pgvector memory in production
  console.log(`[STUB] RAG search: "${query}"`);
  return [
    {
      content: "Previous campaign in Q4 showed 22% revenue lift from bundling top 3 products.",
      similarity: 0.89,
    },
    {
      content: "Customer feedback indicates price sensitivity above $150 for accessories.",
      similarity: 0.82,
    },
  ];
}
