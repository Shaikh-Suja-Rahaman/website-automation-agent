import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  navigateToUrl,
  getPageState,
  scrollDown,
  fillInput,
  clickElement,
  doubleClick,
  clickOnScreen,
  takeScreenshot,
  wait,
  pressKey
} from "./browser.js";





export const navigateTool = tool(
  async ({ url }) => {
    await navigateToUrl(url);
    return `Navigated to ${url}`;
  },
  {
    name: "navigateToUrl",
    description: "Navigate the browser to a given URL and wait for the page to load.",
    schema: z.object({
      url: z.string().describe("Full URL including https://"),
    }),
  }
);




export const pageStateTool = tool(
  async () => {
    const state = await getPageState();
    return JSON.stringify(state, null, 2);
  },
  {
    name: "getPageState",
    description:
      "Returns the current browser state as JSON: URL, page title, scroll telemetry (scrollTop, scrollHeight, clientHeight), and all visible interactive elements (inputs, buttons, links, selects) with their CSS id, name, placeholder, and bounding box. Call this to understand what is on screen before deciding what to click or fill.",
    schema: z.object({}),
  }
);




export const scrollTool = tool(
  async ({ amount }) => {
    await scrollDown(amount);
    return `Scrolled by ${amount}px`;
  },
  {
    name: "scrollDown",
    description:
      "Scroll the page vertically. Use positive values to scroll down, negative values to scroll up. If the element you need is not visible or in the getPageState elements list, use scrollDown to scroll down (e.g. 700px), then call getPageState again to see newly revealed elements.",
    schema: z.object({
      amount: z.coerce.number().describe("Pixels to scroll. Positive = down, negative = up."),
    }),
  }
);



export const fillInputTool = tool(
  async ({ selector, text }) => {
    await fillInput(selector, text);
    return `Filled "${selector}" with "${text}"`;
  },
  {
    name: "fillInput",
    description:
      "Fill a text input or textarea using a CSS selector (e.g. '#name', 'input[name=\"title\"]', 'textarea'). Clears the field before typing.",
    schema: z.object({
      selector: z.string().describe("CSS selector for the input or textarea"),
      text: z.string().describe("Text to type into the field"),
    }),
  }
);



export const clickTool = tool(
  async ({ selector }) => {
    await clickElement(selector);
    return `Clicked "${selector}"`;
  },
  {
    name: "clickElement",
    description:
      "Click an element using a CSS selector (e.g. 'button[type=\"submit\"]', '#submit-btn'). Use getPageState first to discover available selectors.",
    schema: z.object({
      selector: z.string().describe("CSS selector of the element to click"),
    }),
  }
);


export const clickCoordsTool = tool(
  async ({ x, y }) => {
    await clickOnScreen(x, y);
    return `Clicked at (${x}, ${y})`;
  },
  {
    name: "clickOnScreen",
    description:
      "Click at absolute screen coordinates (x, y). Use when you have exact pixel positions from getPageState.",
    schema: z.object({
      x: z.number().describe("Horizontal pixel coordinate"),
      y: z.number().describe("Vertical pixel coordinate"),
    }),
  }
);


export const doubleClickTool = tool(
  async ({ selector }) => {
    await doubleClick(selector);
    return `Double-clicked "${selector}"`;
  },
  {
    name: "doubleClick",
    description: "Double-click an element using a CSS selector.",
    schema: z.object({
      selector: z.string().describe("CSS selector of the element to double-click"),
    }),
  }
);

export const screenshotTool = tool(
  async () => {
    const path = await takeScreenshot();
    return `Screenshot saved to ${path}`;
  },
  {
    name: "takeScreenshot",
    description:
      "Capture the current visible browser viewport and save it to disk. Returns the file path.",
    schema: z.object({}),
  }
);




export const waitTool = tool(
  async ({ ms }) => {
    await wait(ms);
    return `Waited ${ms}ms`;
  },
  {
    name: "wait",
    description:
      "Pause execution for a given number of milliseconds. Use after navigation or interactions that trigger animations or async loading.",
    schema: z.object({
      ms: z.coerce.number().default(1000).describe("Milliseconds to wait"),
    }),
  }
);

export const pressKeyTool = tool(
  async ({ key }) => {
    await pressKey(key);
    return `Pressed ${key}`;
  },
  {
    name: "pressKey",
   description:
  "Press a keyboard key. After filling a search box, use Enter to submit the search when no visible Search button exists. Use Escape to close dialogs. Use Tab to move focus between fields.",
    schema: z.object({
      key: z.enum([
        "Enter",
        "Escape",
        "Tab",
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "Backspace",
        "Delete",
        "Space",
      ]),
    }),
  }
);


export const allTools = [
  navigateTool,
  pageStateTool,
  scrollTool,
  fillInputTool,
  clickTool,
  clickCoordsTool,
  doubleClickTool,
  screenshotTool,
  waitTool,
  pressKeyTool
];
