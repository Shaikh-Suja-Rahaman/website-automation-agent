import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import readline from "readline";
import ora from "ora";
import {systemPrompt} from'./systemPrompt-Agent.js'

import { openBrowser, closeBrowser } from "./browser.js";
import { allTools } from "./Agenttools.js";
import { theme, banner, section, success, info, error } from "./cli-ui-functions.js";

/* =========================
   Model
========================= */

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

  console.log("Configured with: NVIDIA Llama 3.1 70b");
} else if (process.env.GOOGLE_API_KEY) {
  model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
  });

  console.log("Configured with: Google Gemini");
}

if (!model) {
  throw new Error(
    "No supported model API key found. Set NVIDIA_API_KEY or GOOGLE_API_KEY."
  );
}

/* =========================
   Agent
========================= */

const checkpointer = new MemorySaver();

async function enhanceQuery(query, model) {
  const response = await model.invoke([
    {
      role: "system",
      content: `
Rewrite the user's request into a concise task description for an autonomous browser agent.

Rules:
- Preserve intent.
- Do not invent requirements.
- Keep it under 60 words.
- If already clear, return it unchanged.

Example:

User:
Find React Hook Form docs

Output:
Open the React Hook Form documentation, review the relevant sections, and provide a concise summary of the key concepts and usage.
`,
    },
    {
      role: "user",
      content: query,
    },
  ]);

  return response.content.trim();
}


const agent = createReactAgent({
  llm: model,
  tools: allTools,
  checkpointSaver: checkpointer,
  messageModifier: systemPrompt
});

/* =========================
   Input
========================= */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

function isExitCommand(input) {
  const value = input.trim().toLowerCase();
  return value === "exit" || value === "quit";
}

/* =========================
   Main
========================= */

async function main() {
  banner();

  console.log("Opening browser...");
  await openBrowser();
  console.log("Browser ready");

  const threadId = `chat-${Date.now()}`;

  let thinking = null;
  try {
    while (true) {
const userInput = await enhanceQuery(
  await askQuestion(theme.accent.bold("\nUser > ")),
  model
);
      if (isExitCommand(userInput)) {
        break;
      }

      section("Agent");

      // const thinking = ora({
      //   text: "",
      //   spinner: "dots",
      //   color: "white"
      // }).start();

       thinking = ora({
  text: "",
  color: "magenta",
  spinner: {
  interval: 150,
 frames: [
    "▢▢▢▢▢▢",
    "■▢▢▢▢▢",
    "▢■▢▢▢▢",
    "▢▢■▢▢▢",
    "▢▢▢■▢▢",
    "▢▢▢▢■▢",
    "▢▢▢▢▢■",
  ],
},
}).start();

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        {
          configurable: {
            thread_id: threadId,
          },
        }
      );

      let finalMessage = null;

      for await (const chunk of stream) {
        if (chunk.agent) {
          const msg = chunk.agent.messages.at(-1);

          if (msg?.tool_calls?.length > 0) {
            thinking.stop();
            info(`${msg.tool_calls[0].name}()`);
          } else if (msg?.content) {
            finalMessage = msg;
            thinking.stop();
          }
        }

        if (chunk.tools) {
          const tool = chunk.tools.messages.at(-1);
          success(`${tool.name} completed`);
          thinking.start();
        }
      }

      thinking.stop();

      section("Assistant");
      console.log(theme.text(finalMessage?.content ?? "Action completed."));

      console.log(
        theme.muted("\n──────────────────────────────────────────────")
      );
    }
  } catch (err) {
    thinking?.stop?.();
    error(`Runtime error: ${err.message}`);
  } finally {
    section("Shutdown");

    console.log("Closing browser...");
    await closeBrowser();
    console.log("Browser closed");

    rl.close();
    console.log("\nSession ended.\n");
  }
}

main();