# <img align="center" src="../../img/logo.png" width="27"> Agent-Core

Core package used to build AI agents with **InterfaceAgent**.

## 💻 Getting Started

### Prerequisites

- Node.js
- Access to OpenAI or AzureAI services

### Steps

#### 1. ⚡️ Install InterfaceAgent-Core

You can choose to either clone the repository or use npm, yarn, or pnpm to install InterfaceAgent-Core.

#### npm:
```bash
npm install @interface-agent/core
```

#### Yarn:
```bash
yarn add @interface-agent/core
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

You can also explicitly provide these variables as part of the constructor for the `InterfaceAgent` or `BaseInterfaceAgentAgent` class.


#### 3. Interface-Agent Parameters

1. **AMBIGUITY_HANDLING_SCORE**: This parameter controls the agent's confidence level during the planning and subsequent prediction stages. It determines whether the agent should make assumptions or seek further clarification from the user (or caller). A higher score indicates a greater inclination towards system autonomy, with a score of 1 signifying complete autonomy.

#### 3. Configure Mixture of Models

Through the same `env.local` file, you can select the vendor (OpenAI / Claude) and model for each stage of the AI Agent process.

```bash
OPENAI_API_KEY=...
CLAUDE_AI_API_KEY=..
AMBIGUITY_HANDLING_SCORE=1
..
TOOLS_PLANNER_MODEL=CLAUDE_3_HAIKU
PREDICT_NEXT_ACTION_VISUAL_MODEL=GPT4_TURBO_VISION
GENERATE_CODE_SELECTOR_MODEL=GPT35_TURBO
WINDOW_DETECT_MODEL=CLAUDE_3_HAIKU # Windows only
```


