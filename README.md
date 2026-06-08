# Website Automation Agent

An autonomous, AI-driven command-line agent capable of interacting with live websites. Powered by Playwright and LangChain, this agent acts as an automated browsing assistant that can navigate URLs, analyze page structures, scroll, fill forms, and click elements based on natural language prompts.

## Features

- **Autonomous Browsing:** Automatically controls a Chromium browser instance via Playwright to fulfill tasks.
- **Smart DOM Analysis:** Can extract visible/interactive elements, read the DOM, and decide on the next actions dynamically.
- **Support for Leading LLMs:** Configurable to use the Google Gemini model or NVIDIA provided models (like Llama 3.1 70b) to drive the reasoning loop.
- **Built on LangGraph:** Utilizes `createReactAgent` from `@langchain/langgraph` equipped with persistent memory checkpoints.
- **Intelligent Query Enhancement:** Automatically rewrites user queries into concise, actionable task descriptions.
- **Rich CLI UI:** Interactive and colorized terminal output using `chalk` and `ora`.

## Technologies Used

- **Node.js** (ES Modules)
- **[Playwright](https://playwright.dev/):** For headless/headful browser automation.
- **[LangChain](https://js.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraphjs/):** For agent reasoning, tool calling, and state management.
- **Zod:** For defining schema-validated interactions and tools.
- **CLI Utilities:** `chalk`, `ora`, `readline`.

## Prerequisites

- Node.js (v18 or higher recommended)
- API Keys:
  - `GOOGLE_API_KEY` (if using Google Gemini)
  - `NVIDIA_API_KEY` (if using NVIDIA/Llama models)

## Installation

1. Clone the repository and navigate into the directory.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by creating a `.env` file in the root directory:
   ```env
   # Depending on which model you want to use, provide one of the following:
   GOOGLE_API_KEY=your_google_api_key
   NVIDIA_API_KEY=your_nvidia_api_key
   ```

## Usage

Start the agent loop by running the main file:

```bash
node index.js
```

Once running, the CLI will prompt you for input. You can type commands like:
- *"Go to google.com and search for 'LangChain'"*
- *"Open hacker news and take a screenshot of the top trending articles."*

The browser will launch (`headless: false` by default so you can watch the agent work), and the AI will invoke its bound tools to execute your request.

## Available Tools

The agent is equipped with several capabilities under the hood:
- `navigateToUrl`: Change the browser's current page.
- `getPageState`: Intelligently dump visible and interactive elements (links, buttons, inputs) into JSON for the LLM to read.
- `scrollDown`: Scroll the viewpoint vertically.
- `fillInput`: Automatically clear and type into input fields via CSS selectors.
- `clickElement`: Click items on the screen.
- *Additional tools:* `takeScreenshot`, `doubleClick`, `pressKey`, etc.
