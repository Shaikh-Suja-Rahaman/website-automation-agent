import dotenv from "dotenv";
dotenv.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { allTools } from "./agenttools.js";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const agent = createReactAgent({
  llm: model,
  tools: allTools,
});

async function main() {
  const stream = await agent.stream({ messages: [new HumanMessage("hello")] });
  for await (const chunk of stream) {
    console.log("Chunk:", Object.keys(chunk));
  }
}
main();
