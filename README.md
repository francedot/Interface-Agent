# <img align="center" src="./img/logo.png" width="28" style="margin-bottom:5px;">SAgent

<p align="center">
  <a href="/"><img src="https://img.shields.io/badge/typescript-gray?logo=typescript" alt="TypeScript"></a>
  <a href="/"><img src="https://img.shields.io/badge/node-20_LTS-blue" alt="Node 20 LTS"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@osagent/core"><img src="https://img.shields.io/badge/@osagent/core-0.0.5--preview-green"></a>
  <a href="https://www.npmjs.com/package/@osagent/ios"><img src="https://img.shields.io/badge/@osagent/ios-0.0.5--preview-green"></a>
</p>

<p align="center">
  <img align="center" width="1280" src="./img/logo.png" alt="OSAgent Screenshot">
</p>

# 🤔 What is OSAgent?

Welcome to **OSAgent** (/næv eɪ aɪ ɡaɪd/), an extensible multi-modal agentic framework designed to fulfill plans and user queries by tapping into the mobile and desktop ecosystem of apps available. Here's how OSAgent stands out:

- **Visual Task Detection:** Compatible with GPT-4V and many more vision models, OSAgent excels at identifying the next steps directly from page screenshots.

- **Advanced Code Selectors:** Recognizing that visual elements and their positions sometimes fall short, OSAgent employs grounding techniques for both XML and HTML, allowing for precise matching with the most relevant selectors, tailored to the specific action required.

- **Action-Oriented Execution:** At its core, OSAgent features an action-based framework using a JSON schema and reproducible outputs.

- **Resilient Error Handling:** Understanding that errors are part of AI Agents, OSAgent features a built-in retry mechanism with exponential backoff, adeptly navigating through transient failures to ensure the Agent can move forward.

**OSAgent Agents** extend the core toolkit with advanced automation solutions:
- **Preview of Appium iOS Agents:** Explore how your AI Agents can gain access to the ecosystem of apps and functionalities on your iOS device.
- **Preview of Appium Android Agents (Coming soon):** Explore how your AI Agents can gain access to the ecosystem of apps and functionalities on your Android device.
- **Playwright-based Web Agents (Coming soon):** Learn how to build Web AI Agent Companions.

## 💻 Getting Started

You can choose to either clone the repository or use npm, yarn, or pnpm to install OSAgent.

- For Core, see [installation steps](./packages/core/README.md).
- For iOS, see [installation steps](./packages/ios/README.md).

## 🚀 Challenges and Focus

Project OSAgent continues to face challenges in long-horizon planning and code inference accuracy. The current focus is on enhancing the stability of OSAgent agents.

## 🤓 Contributing

We welcome contributions. Please follow the standard fork-and-pull request workflow for your contributions.

## 🛂 License

OSAgent is licensed under the [MIT License](LICENSE).

## 🚑 Support

For support, questions, or feature requests, open an issue in the GitHub repository.