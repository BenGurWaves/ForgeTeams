/**
 * ForgeTeams — Standalone Agent Test
 *
 * Run: npx tsx lib/agents/test-ollama.ts
 *
 * Requires Ollama running locally with qwen3-coder:latest
 * (or set OLLAMA_MODEL env var to use a different model)
 */

import { runTeam } from "./graph";

const SAMPLE_GOAL = "Grow my Shopify revenue 30% this quarter by optimizing pricing, running targeted email campaigns, and improving conversion rates.";

async function main() {
  console.log("=".repeat(60));
  console.log("ForgeTeams — Multi-Agent Test Run");
  console.log("=".repeat(60));
  console.log(`\nGoal: ${SAMPLE_GOAL}\n`);
  console.log("-".repeat(60));

  const startTime = Date.now();
  let messageCount = 0;

  try {
    for await (const msg of runTeam(SAMPLE_GOAL)) {
      messageCount++;
      const agentTag = msg.agent.toUpperCase().padEnd(12);
      console.log(`[${agentTag}] ${msg.content}`);
    }
  } catch (err) {
    console.error("\nFATAL ERROR:", err instanceof Error ? err.message : err);
    console.error("\nMake sure Ollama is running: ollama serve");
    console.error("And the model is pulled: ollama pull qwen3-coder:latest");
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("-".repeat(60));
  console.log(`\nCompleted in ${elapsed}s with ${messageCount} messages.`);
}

main();
