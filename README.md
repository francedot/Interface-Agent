# <img align="center" src="https://github.com/francedot/NavAIGuide/blob/main/img/logo.png?raw=true" width="38"> NavAIGuide

<p align="center">
  <a href="/"><img src="https://img.shields.io/badge/typescript-gray?logo=typescript" alt="Typescript"></a>
  <a href="/"><img src="https://img.shields.io/badge/node-20_LTS-blue" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <a href="https://www.npmjs.com/package/navaiguide-ts"><img src="https://img.shields.io/badge/v.-0.0.1--preview_-green" /></a>
</p>

<p align="center">
  <img align="center" width="1280" src="https://github.com/francedot/NavAIGuide-TS/assets/11706033/bdc79ec6-c05c-4fb4-a01a-0a4b3b802ce9">
</p>

# 🤔 What is NavAIGuide?

Welcome to **NavAIGuide** (/næv eɪ aɪ ɡaɪd/), is an extensible multi-modal agentic framework to achieve plans and user queries tapping into the mobile and desktop ecosystem of apps available. Here's how NavAIGuide sets itself apart:

- **Visual Task Detection:** Leveraging the power of GPT-4V and an array of advanced vision models, NavAIGuide excels at identifying the next steps directly from page screenshots. This intuitive approach ensures that no detail is overlooked.

- **Advanced Code Selectors:** Recognizing that visual elements and their positions sometimes fall short, NavAIGuide employs sophisticated grounding techniques for both XML and HTML. This allows for precise matching with the most relevant selectors, tailored to the specific action required.

- **Action-Oriented Execution:** At the heart of NavAIGuide is a robust action-based framework. Utilizing JSON for its mode of operation, the framework guarantees reproducible results. This predictability, coupled with a focus on actionable tasks, streamlines the execution process.

- **Resilient Error Handling:** Understanding that errors are a part of any dynamic environment, NavAIGuide features a built-in retry mechanism. By employing exponential backoff, it adeptly navigates through transient failures, ensuring your tasks move forward smoothly.

**NavAIGuide Agents** extend the core toolkit with advanced automation solutions:
- **Preview of Appium iOS Agents:** Explore how to have your AI Agents access to the ecosystem of apps and functionalities of your iOS device.
- **Playwright-based web Agents:** Explore how you can build Web AI Agents Companions.

## ⚡️ Quick Install

You can use npm, yarn, or pnpm to install NavAIGuide

For iOS, see [installation steps](./packages/ios/README.md).

## 💻 Getting Started

### Prerequisites

- Node.js
- Access to OpenAI or AzureAI services

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

## 🚀 Challenges and Focus

Project NavAIGuide still faces challenges in long-horizon planning and code inference accuracy. Current focus is on enhancing the stability of the NavAIGuide agent.

## 🤓 Contributing

We welcome contributions. Please follow the standard fork-and-pull request workflow for your contributions.

## 🛂 License

NavAIGuide is under the [MIT License](LICENSE).

## 🚑 Support

For support, questions, or feature requests, open an issue in the GitHub repository.