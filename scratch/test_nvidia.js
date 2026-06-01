import dotenv from "dotenv";
dotenv.config();

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "meta/llama-3.1-70b-instruct",
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
  temperature: 0,
});

async function main() {
  try {
    const res = await model.invoke("Say hello!");
    console.log("Success:", res.content);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
