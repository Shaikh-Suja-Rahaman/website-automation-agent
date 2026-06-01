import dotenv from "dotenv";
dotenv.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";

import { openBrowser, closeBrowser } from "./browser.js";
import { allTools } from "./Agenttools.js";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0,          // for deterministic tool-use decisions
  maxOutputTokens: 4096,
});


const agent = createReactAgent({
  llm:model,
  tools:allTools,
  // System prompt: tells the agent how to reason about the browser
  messageModifier: `
You are an intelligent browser automation agent. You control a real Chromium browser via tools.

Rules:
1. Always call getPageState before interacting with any element so you know what is visible.
2. Use CSS selectors from getPageState (prefer id selectors like #id, then name selectors like input[name="x"], then tag selectors).
3. If an element is not visible, scroll down and call getPageState again.
4. After filling all fields, click the submit button to complete the task.
5. Take a screenshot at the end to confirm success.
6. Think step-by-step and explain your reasoning before each tool call.
`.trim(),
})


const TASK = `
Go to https://ui.shadcn.com/docs/forms/react-hook-form

On that page there is a live demo form with two fields:
  - A "Username" (or Name) input
  - A "Bio" (or Description) textarea

Complete these steps in order:
1. Navigate to the URL above.
2. Call getPageState to inspect visible elements.
3. Scroll down until you can see the form fields (they may be below the fold).
4. Fill the name/username field with: "Website Automation Agent"
5. Fill the bio/description textarea with: "Filled by AI agent, This is super crazy"
6. Click the Submit button.
7. Take a screenshot to confirm the result.
`.trim();


async function main() {
  console.log("Starting Website Automation Agent\n");

  // Open Playwright browser BEFORE the agent starts using tools
  await openBrowser();

  try {
    const result = await agent.invoke({
      messages: [new HumanMessage(TASK)],
    });

    // Print the final assistant message
    const messages = result.messages ?? [];
    const lastMessage = messages[messages.length - 1];
    console.log("\n─── Agent final response ───────────────────────────────");
    console.log(lastMessage?.content ?? "(no response)");
    console.log("────────────────────────────────────────────────────────\n");
  } catch (err) {
    console.error("❌ Agent error:", err);
  } finally {
    // Give the user 5 seconds to see the final state before closing
    console.log("Keeping browser open for 5 seconds…");
    await new Promise((r) => setTimeout(r, 5000));
    await closeBrowser();
    console.log("Done, balle balle");
  }
}

main();