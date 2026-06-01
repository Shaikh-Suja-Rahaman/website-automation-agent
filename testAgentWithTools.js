import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { createAgent } from "langchain";


dotenv.config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

const getCurrentTime = tool(
  async() =>{
    return new Date().toString();
  },
  {
    name: "getCurrentTime",
    description : "Returns current date and time",
    schema: z.object({})
  }
)

const getRandomNumber = tool(
  async()=>{
    console.log("this is a random number generator tool");

    return Math.floor(Math.random()*100).toString();
  },
  {
    name:"getRandomNumber",
    description:"Returns a random number",
    schema:z.object({}),

  }
)

const addNumbers = tool(
  async ({ a, b }) => (a + b).toString(),
  {
    name: "addNumbers",
    description: "Adds two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number()
    })
  }
);

const tools = [
  getCurrentTime,
  getRandomNumber,
  addNumbers
]


const agent = createAgent({
  model: model,
  tools,
})

const response = await agent.invoke({
  messages:[{
    role:"user",
    content:"What is the current Time",
  }]
});

const finalMessage =
  response.messages[response.messages.length - 1];

console.log(finalMessage.content);