# <img align="center" src="https://github.com/francedot/NavAIGuide/blob/main/img/logo.png?raw=true" width="38"> NavAIGuide-Core

Core package used to build AI agents with NavAIGuide.

## 💻 Getting Started

### Prerequisites

- Node.js
- Access to OpenAI or AzureAI services

### Steps

#### 1. ⚡️ Install NavAIGuide-Core

You can choose to either clone the repository or use npm, yarn, or pnpm to install NavAIGuide-Core.

#### npm:
```bash
npm install @navaiguide/core
```

#### Yarn:
```bash
yarn add @navaiguide/core
```

#### 2. Configure OpenAI or AzureAI Key

Configure the necessary environment variables. For example, locally through `.env.local` (requires `dotenv` package):

- `OPENAI_API_KEY`: Your OpenAI API key.
- For Azure AI API keys and related configurations, note that due to the regional availability of different classes of models, more than one Azure AI project deployment might be required.
  - `AZURE_AI_API_GPT4TURBOVISION_DEPLOYMENT_NAME`: Deployment name for [GPT-4 Turbo with Vision](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/gpt-with-vision).
  - `AZURE_AI_API_GPT35TURBO_DEPLOYMENT_NAME`: Deployment name for [GPT-3.5 Turbo with JSON mode](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/json-mode).
  - `AZURE_AI_API_GPT35TURBO16K_DEPLOYMENT_NAME`: Deployment name for [GPT-3.5 Turbo with a 16k max request tokens](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#gpt-35).
  - `AZURE_AI_API_GPT4TURBOVISION_KEY`: API Key for GPT-4 Turbo with Vision.
  - `AZURE_AI_API_GPT35TURBO_KEY`: API Key for GPT-3.5 Turbo with JSON mode and GPT-3.5 with 16k.
  - `AZURE_AI_API_GPT35TURBO_INSTANCE_NAME`: Instance Name for GPT-3.5 Turbo with JSON mode and GPT-3.5 with 16k.
  - `AZURE_AI_API_GPT4TURBOVISION_INSTANCE_NAME`: Instance Name for GPT-4 Turbo with Vision.

You can also explicitly provide these variables as part of the constructor for the `NavAIGuide` or `BaseNavAIGuideAgent` class.