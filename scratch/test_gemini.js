import dotenv from "dotenv";
dotenv.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
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
