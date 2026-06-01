//only job to open an instance of the browser

import { chromium } from "playwright";

let browser = null;
let page = null;



//launch a visible browser and open a blank page
export async function openBrowser() {
  browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  page = await context.newPage();
  console.log("Browser Opened");
  return page;
}


// return the current playwright plage object
export function getPage() {
  if (!page) throw new Error("Browser not open. Call openBrowser() first.");
  return page;
}


//close browser
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
    console.log("Browser Closed");
  }
}



export async function navigateToUrl(url) {
  const page = getPage();

  await page.goto(url, {
    waitUntil: "networkidle",
  });

  console.log(`Navigated to ${url}`);
}



export async function takeScreenshot() {
  const page = getPage();

  await page.screenshot({
    path: `screenshot-${Date.now()}.png`,
  });

  console.log("ScreenShot taken");
}


export async function fillInput(selector, text) {
  const page = getPage();

  await page.fill(selector, text);

  console.log(`Filled ${selector} with ${text}`);
}


export async function getVisibleInteractiveElements() {
  const page = getPage();

  return await page
    .locator("input, textarea, button, a, select")
    .evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const rect = node.getBoundingClientRect();

          const inViewport =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth;

          return {
            tag: node.tagName,
            id: node.id,
            name: node.name,
            type: node.type,
            placeholder: node.placeholder,
            text: node.textContent?.trim(),

            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,

            visible:
              rect.width > 0 &&
              rect.height > 0,

            inViewport,
          };
        })
        .filter(
          (node) =>
            node.visible &&
            node.inViewport
        )
    );
}


export async function getPageState() {
  const page = getPage();

  return {
    url: page.url(),
    title: await page.title(),
    elements: await getVisibleInteractiveElements(),
  };
}

export async function clickElement(selector) {
  const page = getPage();
  await page.click(selector);
  console.log(`Clicked "${selector}"`);


}

export async function doubleClick(selector) {
  const p = getPage();
  await p.dblclick(selector);
  console.log(`Double-clicked "${selector}"`);
}


export async function clickOnScreen(x, y) {
  const p = getPage();
  await p.mouse.click(x, y);
  console.log(`Clicked at (${x}, ${y})`);
}




export async function scrollDown(
  amount = 500
) {
  const page = getPage();

  await page.evaluate(
    (amount) => {
      window.scrollBy(0, amount);
    },
    amount
  );
  console.log(`Scrolled by ${amount}px`);

}

export async function wait(ms = 1000) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(`Waited ${ms}ms`);
}
