import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

const LLM_TIMEOUT_MS = 90_000;

export function createLLM(model?: string, baseUrl?: string) {
  return new ChatOllama({
    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    model: model || process.env.OLLAMA_MODEL || "qwen3.5:4b",
    temperature: 0.3,
    numCtx: 4096,
  });
}

export function createLLMForUser(
  provider: string,
  apiKey: string,
  model: string
): BaseChatModel {
  switch (provider) {
    case "ollama":
      return new ChatOllama({
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        model,
        temperature: 0.3,
        numCtx: 4096,
      });
    case "anthropic":
      return new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: model,
        temperature: 0.3,
      });
    case "openai":
      return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: model,
        temperature: 0.3,
      });
    case "xai":
      return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: model,
        temperature: 0.3,
        configuration: {
          baseURL: "https://api.x.ai/v1",
        },
      });
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// Invoke LLM with direct messages — no ChatPromptTemplate to avoid curly-brace escaping issues
export async function invokeLLM(
  systemPrompt: string,
  userMessage: string,
  model?: string,
  llmConfig?: { provider: string; apiKey: string; model: string }
): Promise<string> {
  const llm = llmConfig
    ? createLLMForUser(llmConfig.provider, llmConfig.apiKey, llmConfig.model)
    : createLLM(model);
  const response = await withTimeout(
    llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]),
    LLM_TIMEOUT_MS,
    "LLM call"
  );
  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

// ============================================================
// SHOPIFY STUB TOOLS
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
    traffic_sources: { organic: 45, direct: 28, social: 18, email: 9 },
  };
}

export async function shopifySendEmail(
  subject: string,
  segment: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[STUB] Sending email "${subject}" to segment: ${segment}`);
  return { success: true, message: `Email "${subject}" queued for ${segment} segment (stub)` };
}

export async function shopifyCreateDiscount(
  code: string,
  percentage: number
): Promise<{ success: boolean; message: string }> {
  console.log(`[STUB] Creating discount ${code} for ${percentage}%`);
  return { success: true, message: `Discount ${code} (${percentage}% off) created (stub)` };
}

// ============================================================
// RESEARCH STUB TOOLS
// ============================================================

export async function webSearch(query: string): Promise<object[]> {
  console.log(`[STUB] Web search: "${query}"`);
  return [
    { title: `Market analysis: ${query}`, snippet: "15-20% growth in premium ecommerce. Price sensitivity decreasing for quality brands.", url: "https://example.com/market" },
    { title: `Competitor pricing`, snippet: "Top competitors price 10-25% higher with bundles. Free shipping at $75 is optimal.", url: "https://example.com/competitors" },
    { title: `Consumer trends`, snippet: "Q1 2026: strong demand for minimalist accessories. Social proof +40% conversion.", url: "https://example.com/trends" },
  ];
}

export async function ragSearch(query: string, _userId?: string): Promise<object[]> {
  console.log(`[STUB] RAG search: "${query}"`);
  return [
    { content: "Q4 campaign: 22% revenue lift from bundling top 3 products.", similarity: 0.89 },
    { content: "Price sensitivity above $150 for accessories.", similarity: 0.82 },
  ];
}
