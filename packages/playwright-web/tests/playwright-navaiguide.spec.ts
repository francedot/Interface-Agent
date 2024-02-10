import { NavAIGuide } from "@navaiguide/core";
import { test } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

let navAIGuide: NavAIGuide;

test.beforeEach(async ({}) => {
  navAIGuide = new NavAIGuide({
    // openAIApiKey: "API_KEY",
  });
});

const findResearchPaperQuery =
  "Help me find the research paper titled 'Set-of-Mark Prompting Unleashes Extraordinary Visual Grounding in GPT-4V'.";
test("Classify Start Task for " + findResearchPaperQuery, async ({}) => {
  const startTask = await navAIGuide.classifyStartTask({
    endGoal: findResearchPaperQuery,
  });

  console.log(startTask);
});

const tryChatGPTQuery = "I'd like to try out ChatGPT";
test("Classify Start Task for " + tryChatGPTQuery, async ({}) => {
  const startTask = await navAIGuide.classifyStartTask({
    endGoal: tryChatGPTQuery,
  });

  console.log(startTask);
});

test("Predict Next NL Action and Generate Code Actions for https://arxiv.org/abs/2308.08155", async ({
  page,
}) => {
  await page.goto("https://arxiv.org/abs/2308.08155");

  const inputPage = await NavAIGuidePage.fromPlaywrightAsync({ page });

  const query = "Download the paper in PDF format";
  const previousActions: NLAction[] = [];

  const nextAction = await navAIGuide.predictNextNLAction({
    page: inputPage,
    endGoal: query,
  });

  const codeActions = await navAIGuide.generateCodeActions({
    page: inputPage,
    endGoal: query,
    previousActions: previousActions,
    nextAction: nextAction,
  });

  for (const codeAction of codeActions) {
    if (await tryAsyncEval({ page }, codeAction.code)) {
      break;
    }
  }

  // Use waitForLoadState to wait for the page load to complete after clicking the link
  await page.waitForLoadState("networkidle"); // Waits until there are no network connections for at least 500 ms
});

test("Predict Next NL Action and Generate Code Actions for https://openai.com", async ({ page }) => {
  await page.goto("https://openai.com");

  const query = "Tell me about pricing of ChatGPT";
  const inputPage = await NavAIGuidePage.fromPlaywrightAsync({ page });

  const nextAction = await navAIGuide.predictNextNLAction({
    page: inputPage,
    endGoal: query,
  });

  const codeActions = await navAIGuide.generateCodeActions({
    page: inputPage,
    endGoal: query,
    nextAction: nextAction,
  });

  for (const codeAction of codeActions) {
    if (await tryAsyncEval({ page }, codeAction.code)) {
      break;
    }
  }

  console.log(nextAction);
});

test(
  "Classify Start Task, Predict Next NL Action and Generate Code Actions for " + findResearchPaperQuery,
  async ({ page }) => {
    const startTask = await navAIGuide.classifyStartTask({
      endGoal: findResearchPaperQuery,
    });

    await page.goto(startTask.startPage);

    const inputPage = await NavAIGuidePage.fromPlaywrightAsync({ page });

    const previousActions: NLAction[] = [];
    const nextAction = await navAIGuide.predictNextNLAction({
      page: inputPage,
      endGoal: findResearchPaperQuery,
      previousActions: previousActions,
      mode: "textual", // or visual.
    });

    const codeFailures : string[] = [];
    let success = false;
    while (!success) {
      const codeActions = await navAIGuide.generateCodeActions({
        page: inputPage,
        endGoal: findResearchPaperQuery,
        previousActions: previousActions,
        nextAction: nextAction,
        codeFailures: codeFailures,
      });

      for (const codeAction of codeActions) {
        const result = await tryAsyncEval({ page }, codeAction.code);
        success = result[0];
        if (!success) {
          codeFailures.push(codeAction.code);
        }
      }
    }

    await page.waitForLoadState("networkidle"); // Waits until there are no network connections for at least 500 ms
  }
);

const downloadPaperQuery =
  "Download the paper in PDF format from https://arxiv.org/abs/2308.08155";
test("E2E NL Tasks & Coded Tasks - " + downloadPaperQuery, async ({ page }) => {
  // Get starting task
  const startTask = await navAIGuide.classifyStartTask({
    endGoal: downloadPaperQuery,
  });

  // Navigate to starting location
  await page.goto(startTask.startPage);

  // Take screenshot and collect page DOM
  const inputPage = await NavAIGuidePage.fromPlaywrightAsync({ page });

  const previousActions: NLAction[] = [];

  // NL: Finetune the starting task in relation to the page content (visual or textual)
  const nextAction = await navAIGuide.predictNextNLAction({
    page: inputPage,
    endGoal: downloadPaperQuery,
    mode: "textual", // or visual
  });

  // Traduce the NL tasks into coded workflows (e.g. Playwright)
  const codeActions = await navAIGuide.generateCodeActions({
    page: inputPage,
    endGoal: downloadPaperQuery,
    previousActions: previousActions,
    nextAction: nextAction,
  });

  for (const codeAction of codeActions) {
    // Run the workflow against the page
    await asyncEval({ page }, codeAction.code);
    await page.waitForLoadState("networkidle"); // Waits until there are no network connections for at least 500 ms  }
  }
});
