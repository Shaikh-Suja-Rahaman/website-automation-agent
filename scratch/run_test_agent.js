import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

import { openBrowser, closeBrowser } from "../browser.js";
import { allTools } from "../agenttools.js";

// Dynamically select the best available model
let model;
if (process.env.NVIDIA_API_KEY) {
  model = new ChatOpenAI({
    modelName: "meta/llama-3.1-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,
    configuration: {
      baseURL: "https://integrate.api.nvidia.com/v1",
    },
    temperature: 0,
  });
  console.log("🤖 Configured with: NVIDIA Llama 3.1 70b");
} else if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("YOUR_")) {
  model = new ChatOpenAI({
    modelName: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });
  console.log("🤖 Configured with: OpenAI GPT-4o");
} else if (process.env.GEMINI_API_KEY) {
  model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
  });
  console.log("🤖 Configured with: Gemini 2.5 Flash");
}

const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm: model,
  tools: allTools,
  checkpointSaver: checkpointer,
  messageModifier: `
You are an intelligent, autonomous browser automation agent. First, analyze the user's intent before taking action.

SCENARIO 1: PURE NAVIGATION OR GENERAL QUESTIONS
- If the user just says "navigate to [url]" or "go to [url]", ONLY invoke "navigateToUrl" tool.
- Do NOT call "getPageState" or "scrollDown" or any other tools.
- After navigation completes, simply respond with: "I have navigated to the page. What would you like to do next?"

SCENARIO 2: SEARCHING, FORM-FILLING, CLICKING, OR INTERACTING
If the user asks you to find, identify, fill, click, or interact with elements:
- You must be systematic, persistent, and cautious. Do NOT guess selectors and do NOT give up early.
- FIRST, call "getPageState" to inspect the current state of the page (including URL, title, scroll position, and visible elements).
- ONCE YOU HAVE the page state, follow these rules:

CRITICAL RULES:
1. NEVER guess or assume CSS selectors. You MUST ONLY call interaction tools (like "fillInput", "clickElement", "doubleClick") using the exact CSS selectors present in the "elements" list of the most recent "getPageState" output.
2. If the elements you need (e.g. name or description inputs) are NOT listed in the "elements" array of the current page state:
   - THE TASK IS NOT COMPLETE. YOU ARE FORBIDDEN from outputting conversational text or declaring the elements "not found", "not visible", or "impossible to fill".
   - You MUST call "scrollDown" (amount: 700) to scroll down.
   - IMMEDIATELY call "getPageState" again to inspect the new view.
   - Repeat this scroll-and-inspect loop until you find the elements or reach the bottom of the page (where scrollTop + clientHeight >= scrollHeight).
   - Only when you have reached the very bottom of the page and still cannot find the elements, you may stop and report this to the user.
3. If the user asks you to fill in a field but does not specify the exact value/text to fill, you MUST NOT ask for clarification or give up. Instead, autonomously generate a sensible placeholder value (e.g., "John Doe" for names, "This is a test description" for descriptions, "john@example.com" for emails) and call the "fillInput" tool to fill it.
4. While searching and interacting, ONLY emit tool calls. Do NOT write any conversational explanation to the user during the search loop.
`.trim(),
});

async function runStep(userInput, threadId) {
  console.log(`\nUser: ${userInput}`);
  console.log("Thinking & Browsing...");

  const stream = await agent.stream(
    { messages: [new HumanMessage(userInput)] },
    { configurable: { thread_id: threadId } }
  );

  let finalMessage = null;

  for await (const chunk of stream) {
    if (chunk.agent) {
      const agentMsg = chunk.agent.messages[chunk.agent.messages.length - 1];
      if (agentMsg.tool_calls && agentMsg.tool_calls.length > 0) {
        console.log(`🤖 Agent is calling tools: ${JSON.stringify(agentMsg.tool_calls.map(tc => tc.name))}`);
        for (const tc of agentMsg.tool_calls) {
          console.log(`   Arguments: ${JSON.stringify(tc.args)}`);
        }
      } else {
        finalMessage = agentMsg;
      }
    } else if (chunk.tools) {
      const toolMsg = chunk.tools.messages[chunk.tools.messages.length - 1];
      console.log(`🛠  Tool finished: ${toolMsg.name}`);
      console.log(`   Output: ${toolMsg.content.slice(0, 300)}...`);
    }
  }

  console.log("\n─── Agent ───────────────────────────────");
  console.log(finalMessage?.content ?? "(Action completed)");
  console.log("─────────────────────────────────────────");
}

async function main() {
  await openBrowser();
  const threadId = "test-session-" + Date.now();
  
  try {
    // Step 1: Navigate
    await runStep("navigate to https://ui.shadcn.com/docs/forms/react-hook-form", threadId);
    
    // Step 2: Search and fill form
    await runStep("Identify the form elements on the page (Name and Description fields) and automatically fill in the Name and Description", threadId);
    
    // Wait and screenshot to verify
    await new Promise(r => setTimeout(r, 2000));
    console.log("\nTaking screenshot to verify...");
    const screenshotAgent = createReactAgent({
      llm: model,
      tools: allTools,
      checkpointSaver: checkpointer,
    });
    const ssStream = await screenshotAgent.stream(
      { messages: [new HumanMessage("take a screenshot to prove the form is filled")] },
      { configurable: { thread_id: threadId } }
    );
    for await (const chunk of ssStream) {
      if (chunk.agent) {
        const agentMsg = chunk.agent.messages[chunk.agent.messages.length - 1];
        if (agentMsg.tool_calls && agentMsg.tool_calls.length > 0) {
          console.log(`🤖 Agent is calling tool: ${agentMsg.tool_calls[0].name}`);
        }
      } else if (chunk.tools) {
        console.log(`🛠  Tool finished: ${chunk.tools.messages[0].name}`);
      }
    }
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await closeBrowser();
  }
}

main();
