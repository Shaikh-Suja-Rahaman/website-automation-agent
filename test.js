import {
  openBrowser,
  navigateToUrl,
  takeScreenshot,
  closeBrowser,
  getPageElements,
  getInputs,
  fillInput,
  getInteractiveElements,
  getVisibleInteractiveElements
} from "./browser.js";

await openBrowser();

await navigateToUrl(
  "https://ui.shadcn.com/docs/forms/react-hook-form"
);

console.log(await getVisibleInteractiveElements());


await fillInput(
  "#form-rhf-demo-title",
  "Website Automation Agent"
);

await fillInput(
  "#form-rhf-demo-description",
  "This form was filled automatically using Playwright."
);

await takeScreenshot();
await closeBrowser();



// const inputs = await getInputs();

// console.log(inputs);