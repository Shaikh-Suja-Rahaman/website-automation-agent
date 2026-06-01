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

  const count = await page.locator(selector).count().catch(() => 0);
  if (count === 0) {
    throw new Error(`Selector "${selector}" does not exist in the DOM. Use getPageState to discover valid selectors, or scrollDown to find them.`);
  }

  await page.fill(selector, text);

  console.log(`Filled ${selector} with ${text}`);
}


export async function getVisibleInteractiveElements() {
  const page = getPage();

  const rawElements = await page
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

          // Exclude noise (navigation links/buttons in sidebars, headers, menus, etc.)
          const isNavLink = node.tagName === 'A' || node.tagName === 'BUTTON';
          const inNavContainer = node.closest('aside, nav, header, footer, .sidebar, .nav, .menu, [role="navigation"], [role="banner"]') !== null;
          const isNoise = isNavLink && inNavContainer;

          // Generate a candidate selector
          let selector = '';
          if (node.id) {
            selector = `#${node.id}`;
          } else if (node.name) {
            selector = `${node.tagName.toLowerCase()}[name="${node.name}"]`;
          } else if (node.getAttribute('aria-label')) {
            selector = `${node.tagName.toLowerCase()}[aria-label="${node.getAttribute('aria-label')}"]`;
          } else if (node.placeholder) {
            selector = `${node.tagName.toLowerCase()}[placeholder="${node.placeholder}"]`;
          } else {
            selector = node.tagName.toLowerCase();
            if (node.className) {
              const classes = node.className.trim().split(/\s+/).filter(c => c && !c.includes(':') && !c.startsWith('radix-'));
              if (classes.length > 0) {
                selector += `.${classes.slice(0, 2).join('.')}`;
              }
            }
          }

          return {
            tag: node.tagName,
            id: node.id || undefined,
            name: node.name || undefined,
            type: node.type || undefined,
            placeholder: node.placeholder || undefined,
            text: node.textContent?.trim() || undefined,
            selector: selector,

            visible: rect.width > 0 && rect.height > 0 && !isNoise,
            inViewport,
          };
        })
        .filter(
          (node) =>
            node.visible &&
            node.inViewport
        )
    );

  // Streamline details to reduce tokens substantially
  return rawElements.map((el) => {
    const res = {
      tag: el.tag,
      selector: el.selector,
    };
    if (el.id) res.id = el.id;
    if (el.name) res.name = el.name;
    if (el.type && el.type !== 'submit' && el.type !== 'button') res.type = el.type;
    if (el.placeholder) res.placeholder = el.placeholder;
    if (el.text && el.text.length < 80) res.text = el.text;
    return res;
  });
}


export async function getPageState() {
  const page = getPage();

  const scrollInfo = await page.evaluate(() => {
    return {
      scrollTop: window.scrollY || document.documentElement.scrollTop,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    };
  });

  return {
    url: page.url(),
    title: await page.title(),
    scroll: scrollInfo,
    elements: await getVisibleInteractiveElements(),
  };
}

export async function clickElement(selector) {
  const page = getPage();

  const count = await page.locator(selector).count().catch(() => 0);
  if (count === 0) {
    throw new Error(`Selector "${selector}" does not exist in the DOM. Use getPageState to discover valid selectors, or scrollDown to find them.`);
  }

  await page.click(selector);
  console.log(`Clicked "${selector}"`);
}

export async function doubleClick(selector) {
  const p = getPage();

  const count = await p.locator(selector).count().catch(() => 0);
  if (count === 0) {
    throw new Error(`Selector "${selector}" does not exist in the DOM. Use getPageState to discover valid selectors, or scrollDown to find them.`);
  }

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
