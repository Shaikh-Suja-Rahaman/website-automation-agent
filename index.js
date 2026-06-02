import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import readline from "readline";

import { openBrowser, closeBrowser } from "./browser.js";
import { allTools } from "./Agenttools.js";

import chalk from "chalk"
import ora from "ora"
import {theme, banner, section, success, info, error} from './cli-ui-functions.js'


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
  console.log(chalk.bold.cyan("Configured with: NVIDIA Llama 3.1 70b"));
  console.log(chalk.gray("────────────────────────────────────"));

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));



async function main() {
  banner();

  const spinner = ora({
    text: theme.muted("Launching browser..."),
  }).start();

  await openBrowser();

  spinner.succeed(theme.success("Browser ready"));

  const threadId = `chat-${Date.now()}`;

  try {
    while (true) {
      const userInput = await askQuestion(
        theme.accent.bold("\nUser > ")
      );

      if (
        ["exit", "quit"].includes(userInput.toLowerCase())
      ) {
        break;
      }

      section("Agent");

      const thinking = ora({
        text: theme.muted("Thinking..."),
      }).start();

      const stream = await agent.stream(
        {
          messages: [new HumanMessage(userInput)],
        },
        {
          configurable: {
            thread_id: threadId,
          },
        }
      );

      let finalMessage = null;

      for await (const chunk of stream) {
        if (chunk.agent) {
          const msg =
            chunk.agent.messages[
              chunk.agent.messages.length - 1
            ];

          if (
            msg.tool_calls &&
            msg.tool_calls.length > 0
          ) {
            thinking.stop();

            info(
              `${msg.tool_calls[0].name}()`
            );
          } else {
            finalMessage = msg;
          }
        }

        if (chunk.tools) {
          const tool =
            chunk.tools.messages[
              chunk.tools.messages.length - 1
            ];

          success(`${tool.name} completed`);
        }
      }

      section("Assistant");

      console.log(
        theme.text(
          finalMessage?.content ??
            "Action completed."
        )
      );

      const usage =
        finalMessage?.usage_metadata;

      if (usage) {
        console.log(
          "\n" +
            theme.muted(
              `Tokens: ${usage.total_tokens} ` +
                `(In: ${usage.input_tokens}, Out: ${usage.output_tokens})`
            )
        );
      }

      console.log(
        theme.muted(
          "\n──────────────────────────────────────────────"
        )
      );
    }
  } catch (err) {
    error(`Runtime error: ${err.message}`);
  } finally {
    section("Shutdown");

    const spinner = ora({
      text: theme.muted("Closing browser..."),
    }).start();

    await closeBrowser();

    spinner.succeed(
      theme.success("Browser closed")
    );

    rl.close();

    console.log(
      "\n" + theme.muted("Session ended.\n")
    );
  }
}
main();
