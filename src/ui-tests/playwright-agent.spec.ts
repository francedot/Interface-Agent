import { test } from "@playwright/test";
import { PlaywrightAgent } from "../playwright-agent";

const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';
test.use({userAgent});
test.describe.configure({ mode: "parallel" });

let navAIGuideAgent: PlaywrightAgent;

test.beforeEach(async ({ page }) => {
  navAIGuideAgent = new PlaywrightAgent({
    page: page, 
  });
});

const findResearchPaperQuery = "Help me view the research paper titled 'Set-of-Mark Prompting Unleashes Extraordinary Visual Grounding in GPT-4V' and download its pdf.";
test(findResearchPaperQuery + " - NavAIGuideLLMAgent", async ({
}) => {

  const results = await navAIGuideAgent.runAsync({
    query: findResearchPaperQuery
  });
  
  for (const result of results) {
    console.log(result);
  }
});

const tryChatGPTQuery = "I'd like to try out OpenAI ChatGPT";
test(tryChatGPTQuery + " - NavAIGuideLLMAgent", async ({
}) => {
  await navAIGuideAgent.runAsync({
    query: tryChatGPTQuery
  });
});

const iPhoneQueryQuery = "Help me find a cheap iPhone";
test(iPhoneQueryQuery + " - NavAIGuideLLMAgent", async ({
}) => {
  await navAIGuideAgent.runAsync({
    query: iPhoneQueryQuery
  });
});

const candleLightsTicketQuery = "Help me find tickets for the earliest candle lights concert in Dublin"
test(candleLightsTicketQuery + " - NavAIGuideLLMAgent", async ({
}) => {
  const result = await navAIGuideAgent.runAsync({
    query: candleLightsTicketQuery
  });

  console.log(result);
});

const dundrumCinemaQuery = "What movies are playing in Dundrum Dublin cinema today?";
test(dundrumCinemaQuery + " - NavAIGuideLLMAgent", async ({
}) => {
  const result = await navAIGuideAgent.runAsync({
    query: dundrumCinemaQuery
  });

  console.log(result);
});