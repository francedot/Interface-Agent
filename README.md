# 🤖 NavAIGuide-TS

<p align="center">
  <a href="/"><img src="https://img.shields.io/badge/typescript-gray?logo=typescript" alt="Typescript"></a>
  <a href="/"><img src="https://img.shields.io/badge/node-20_LTS-blue" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <a href="https://www.npmjs.com/package/navaiguide-ts"><img src="https://img.shields.io/badge/v.-0.0.1--preview_-green" /></a>
</p>

<p align="center">
  <img align="center" src="https://github.com/francedot/NavAIGuide/blob/main/img/logo.png?raw=true" width="250">
</p>

<p align="center">
  <img align="center" src="https://github.com/francedot/NavAIGuide/assets/11706033/7cdd4f9f-7905-4b4a-967b-cabe34502789">
</p>

# 🤔 What is NavAIGuide?

**NavAIGuide** is a TypeScript Extensible components toolkit for integrating LLMs into Navigation Agents and Browser Companions. Key features include:
- **Natural Language Task Detection:** Supports both visual (using GPT-4V) and textual modes to identify tasks from web pages.
- **Automation Code Generation:** Automates the creation of code for predicted tasks with options for Playwright (requires Node) or native JavaScript Browser APIs.
- **Visual Grounding:** Enhances the accuracy of locating visual elements on web pages for better interaction.
- **Efficient DOM Processing and Token Reduction:** Utilizes advanced strategies for DOM element management, significantly reducing the number of tokens required for accurate grounding and action detection.
- **Reliability:** Includes a retry mechanism with exponential backoff to handle transient failures in LLM calls.
- **JSON Mode & Action-based Framework:** Utilizes JSON mode and reproducible outputs for predictable outcomes and an action-oriented approach for task execution.

**NavAIGuide Agents** extend the core toolkit with advanced automation solutions:
- **Preview of Playwright-based Agents:** Initial offerings for browser automation.
- **Cross-platform Appium Support:** Future updates will introduce compatibility with Appium for broader device coverage.

NavAIGuide aims to streamline the development process for web navigation assistants, offering a comprehensive suite of tools for developers to leverage LLMs in web automation efficiently.

## ⚡️ Quick Install

You can use npm, yarn, or pnpm to install NavAIGuide

### npm:
```bash
  npm install naviguide-ts
  // With Playwright:
  npm install --dev "@playwright/test"
  npx playwright install
```

### Yarn:
```bash
  yarn add naviguide-ts
  // With Playwright:
  yarn add --dev "@playwright/test"
  npx playwright install
```

## 💻 Getting Started

### Prerequisites

- Node.js
- Access to OpenAI or AzureAI services
- Playwright for automation capabilities

### OpenAI & AzureAI Key Configuration

Configure the necessary environment variables. For example locally through `.env.local` (requires `dotenv`):

- `OPENAI_API_KEY`: Your OpenAI API key.
- Azure AI API keys and related configurations. Note that due to region availability of different classes of models, more than 1 Azure AI Project deployment might be required.
  - `AZURE_AI_API_GPT4TURBOVISION_DEPLOYMENT_NAME`: Deployment of
 [GPT-4 Turbo with Vision](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/gpt-with-vision).
  - `AZURE_AI_API_GPT35TURBO_DEPLOYMENT_NAME`: Deployment of [GPT3.5 Turbo with JSON mode](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/json-mode).
  - `AZURE_AI_API_GPT35TURBO16K_DEPLOYMENT_NAME`: Deployment of
 [GPT-3.5 with 16k max request tokens](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#gpt-35).
  - `AZURE_AI_API_GPT4TURBOVISION_KEY`: GPT-4 Turbo with Vision API Key
  - `AZURE_AI_API_GPT35TURBO_KEY`: GPT3.5 Turbo with JSON mode and GPT-3.5 with 16k API Key
  - `AZURE_AI_API_GPT35TURBO_INSTANCE_NAME`: GPT-4 Turbo with Vision API Key Instance Name
  - `AZURE_AI_API_GPT4TURBOVISION_INSTANCE_NAME`: GPT3.5 Turbo with JSON mode and GPT-3.5 with 16k Instance Name

You can also explicitly provide the variables as part of the constructor of the `NavAIGuide` class.

### NavAIGuide Agent

The `NavAIGuideAgent` base class orchestrates the process of performing and reasoning about actions on a web page towards achieving a specified end goal.

#### Example Playwright Agent scenario:
```typescript
import { Page } from "@playwright/test";
import { PlaywrightAgent } from "naviguide-ts";

let navAIGuideAgent = new PlaywrightAgent({
  page: playwrightPage
  openAIApiKey: "API_KEY", // if not provided as process.env
});
```

```typescript
const findResearchPaperQuery = "Help me view the research paper titled 'Set-of-Mark Prompting Unleashes Extraordinary Visual Grounding in GPT-4V' and download its pdf.";

const results = await navAIGuideAgent.runAsync({
  query: findResearchPaperQuery
});

for (const result of results) {
  console.log(result);
}
```

### NavAIGuide Core Functionalities

```typescript
let navAIGuide: NavAIGuide = new NavAIGuide({
    openAIApiKey: "API_KEY", // if not provided as process.env
});
```

Some of the queries NavAIGuide is able to handle today:
```typescript
const findResearchPaperQuery = 
  "Help me find the research paper titled 'Set-of-Mark Prompting Unleashes Extraordinary Visual Grounding in GPT-4V'.";

const candleLightsTicketQuery =
  "Help me find tickets for the earliest candle lights concert in Dublin"

const dundrumCinemaQuery =
  "What movies are playing in Dundrum Dublin cinema today?";
```

NavAIGuide underlying process is divided into distinct steps:

**Start Task Identification**: The Agent determines the starting point based on the nature of the query. It could be a general search engine, specialized services, or a specific URL.

```typescript
const startTask = await navAIGuide.classifyStartTask({
  endGoal: findResearchPaperQuery,
});

await playwrightPage.goto(startTask.startPage);
```

**HTML DOM and Screenshot Processing**: The page's HTML DOM is analyzed, condensed and chunked. Screenshots are also taken if running in Visual mode.

```typescript
const inputPage = await NavAIGuidePage.fromPlaywrightAsync({ playwrightPage });
```

**Action Prediction**: Depending on the specified end goal and past actions, the Agent predicts the next action using either:
  - **Textual Analysis**: (Faster, less reliable) Involves grounding website stucture from text and predicting actions based on them.
  - **Visual Analysis**: (Slower, more reliable) Employs GPT4-V for processing screenshots, focusing on visual elements to guide actions.

```typescript
const previousActions: NLAction[] = [ .. ]; // Any previous NL actions as history
const nextAction = await navAIGuide.predictNextNLAction({
  page: inputPage,
  endGoal: findResearchPaperQuery,
  previousActions: previousActions,
  mode: "visual", // or textual
});
```

**Code Inference and Automation**: Converts the predicted natural language action into automation code (Playwright, JS Browser APIs), including retry patterns for feedback on unsuccessful attempts.

```typescript
const codeActionResult = await navAIGuide.runCodeActionWithRetry({
  inputPage: inputPage,
  endGoal: findResearchPaperQuery,
  nextAction: nextAction,
  maxRetries: 3,
  codeEvalFunc: 
    // Your logic for injecting the code into the page goes here.
    async (code) => await tryAsyncEval({ page: playwrightPage }, code),
});
```

**Reasoning Steps**: Two reasoning steps can optionally be performed to improve the reliability of NavAIGuide-based agents:
  - Reasoning whether the action held the expected result by assessing any page state changes.
```typescript
const actionFeedbackReasoningResult =
  await this.navAIGuide.RunActionFeedbackReasoning({
    beforePage: currentNavAIGuidePage,
    afterPage: nextNavAIGuidePage,
    takenAction: nextAction,
  });

if (
  !actionFeedbackReasoningResult ||
  !actionFeedbackReasoningResult.actionSuccess
) {
  console.log(`The action did not hold the expected results: ${actionFeedbackReasoningResult.pageStateChanges}.`);
  nextAction.actionSuccess = false;
  continue;
}
console.log(`The action held the expected results: ${actionFeedbackReasoningResult.pageStateChanges}.`);
```
  - Reasoning whether the end goal has been achieved and retrieving any relevant information.
```typescript
const { endGoalMet, relevantData } = await this.navAIGuide.RunGoalCheckReasoning({
  page: nextNavAIGuidePage,
  endGoal: findResearchPaperQuery,
  newInformation: actionFeedbackReasoningResult.newInformation,
});

if (endGoalMet) {
  console.log(`Goal was met. Found relevant data:`);
  for (const data of relevantData) {
    if (data[0] && data[1]) {
      console.log(`${data[0]} - ${data[1]}`);
    }
  }
  return relevantData;
}
```

## 🚀 Challenges and Focus

Project NavAIGuide still faces challenges in long-horizon planning and code inference accuracy. Current focus is on enhancing the stability of the NavAIGuide agent.

## 🤓 Contributing

We welcome contributions. Please follow the standard fork-and-pull request workflow for your contributions.

## 🛂 License

NavAIGuide is under the [MIT License](LICENSE).

## 🚑 Support

For support, questions, or feature requests, open an issue in the GitHub repository.
