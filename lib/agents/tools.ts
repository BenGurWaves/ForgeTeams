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
// SHOPIFY TOOLS (real Shopify GraphQL with mock fallback)
// ============================================================

export async function shopifyGetProducts(
  shopDomain?: string,
  encryptedToken?: string
): Promise<object[]> {
  if (!shopDomain || !encryptedToken) {
    return [
      {
        id: "gid://shopify/Product/1",
        title: "Premium Leather Wallet",
        variants: [
          { id: "gid://shopify/ProductVariant/1", price: "89.99", inventoryQuantity: 142 },
        ],
      },
      {
        id: "gid://shopify/Product/2",
        title: "Canvas Tote Bag",
        variants: [
          { id: "gid://shopify/ProductVariant/2", price: "45.00", inventoryQuantity: 78 },
        ],
      },
      {
        id: "gid://shopify/Product/3",
        title: "Minimalist Watch",
        variants: [
          { id: "gid://shopify/ProductVariant/3", price: "199.00", inventoryQuantity: 34 },
        ],
      },
      {
        id: "gid://shopify/Product/4",
        title: "Merino Wool Scarf",
        variants: [
          { id: "gid://shopify/ProductVariant/4", price: "65.00", inventoryQuantity: 201 },
        ],
      },
      {
        id: "gid://shopify/Product/5",
        title: "Titanium Keychain",
        variants: [
          { id: "gid://shopify/ProductVariant/5", price: "32.00", inventoryQuantity: 89 },
        ],
      },
    ];
  }

  const { getProducts } = await import("../shopify-graphql");
  return getProducts(shopDomain, encryptedToken);
}

export async function shopifyUpdatePrice(
  variantId: string,
  newPrice: string,
  shopDomain?: string,
  encryptedToken?: string
): Promise<{ success: boolean; message: string }> {
  if (!shopDomain || !encryptedToken) {
    console.log(`[MOCK] Updating price for ${variantId} to $${newPrice}`);
    return {
      success: true,
      message: `Price for ${variantId} updated to $${newPrice} (mock)`,
    };
  }

  const { updateVariantPrice } = await import("../shopify-graphql");
  const variant = await updateVariantPrice(
    shopDomain,
    encryptedToken,
    variantId,
    newPrice
  );
  return {
    success: true,
    message: `Price for ${variant.title} (${variant.id}) updated to $${variant.price}`,
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
// RESEARCH TOOLS (real Serper.dev with mock fallback)
// ============================================================

export async function webSearch(
  query: string
): Promise<Array<{ title: string; snippet: string; url: string }>> {
  const apiKey = process.env.SERPER_API_KEY;

  // Fallback to mock if no Serper key
  if (!apiKey) {
    console.log(`[MOCK] Web search: "${query}"`);
    return [
      {
        title: `Market analysis: ${query}`,
        snippet:
          "Industry data suggests 15-20% growth in premium ecommerce segments.",
        url: "https://example.com/market",
      },
      {
        title: `Competitor pricing`,
        snippet:
          "Top competitors price 10-25% higher with bundle strategies.",
        url: "https://example.com/competitors",
      },
      {
        title: `Consumer trends`,
        snippet:
          "Q1 2026: strong demand for minimalist accessories.",
        url: "https://example.com/trends",
      },
    ];
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  return ((data.organic || []) as Array<{ title?: string; snippet?: string; link?: string }>)
    .slice(0, 5)
    .map((r) => ({
      title: r.title || "",
      snippet: r.snippet || "",
      url: r.link || "",
    }));
}

export async function ragSearch(query: string, _userId?: string): Promise<object[]> {
  console.log(`[STUB] RAG search: "${query}"`);
  return [
    { content: "Q4 campaign: 22% revenue lift from bundling top 3 products.", similarity: 0.89 },
    { content: "Price sensitivity above $150 for accessories.", similarity: 0.82 },
  ];
}
