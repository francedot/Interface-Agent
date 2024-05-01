# <img align="center" src="./img/logo.png" width="28" style="margin-bottom:5px;margin-right:2px;">Agent

<p align="center">
  <a href="/"><img src="https://img.shields.io/badge/typescript-gray?logo=typescript" alt="TypeScript"></a>
  <a href="/"><img src="https://img.shields.io/badge/node-20_LTS-blue" alt="Node 20 LTS"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@interface-agent/core"><img src="https://img.shields.io/badge/@interface--agent/core-0.0.1--preview-green"></a>
  <a href="https://www.npmjs.com/package/@interface-agent/ios"><img src="https://img.shields.io/badge/@interface--agent/ios-0.0.1--preview-green"></a>
  <a href="https://www.npmjs.com/package/@interface-agent/windows"><img src="https://img.shields.io/badge/@interface--agent/windows-0.0.1--preview-green"></a>
</p>

<p align="center">
  <img align="center" width="320" src="./img/logo.png" alt="InterfaceAgent Screenshot">
</p>

# 🤔 What is InterfaceAgent?

Welcome to **InterfaceAgent**, a multi-modal agentic framework to build system and interface agent capable of controlling mobile and desktop features and apps.

Here's how InterfaceAgent stands out:

- **Planning & Goal Refinement**: the agent can build multi-steps plan across apps to fullfill user requests, and reiterate based on user feedbacks during the evaluation phase. 

- **Action Prediction (Pure Visual / Textual / Set-of-Mark Visual Prompting)**: Use visual coordinate-based approach, pure DOM textual, or set-of-marking for increased accuracy in determining the next probable action.

- **Mixture of Models:** Compatible with GPT-4V and many more vision models, InterfaceAgent excels at identifying the next steps directly from page screenshots.

- **Resilient Error Handling:** Understanding that errors are part of AI Agents, InterfaceAgent features a built-in retry mechanism with exponential backoff, adeptly navigating through transient failures to ensure the Agent can move forward.

**InterfaceAgent Agents** extend the core toolkit with advanced automation solutions:
- **Preview of iOS Agents:** Explore how your AI Agents can gain access to the ecosystem of apps and functionalities on your iOS device.
- **Preview of Windows Agents:** Explore how your AI Agents can gain access to the ecosystem of apps and functionalities on your Windows 11 device.
- **Preview of Appium Android Agents (Coming soon):** Explore how your AI Agents can gain access to the ecosystem of apps and functionalities on your Android device.
- **Playwright-based Web Agents (Coming soon):** Learn how to build Web AI Agent Companions.

## 💻 Getting Started

You can choose to either clone the repository or use npm, yarn, or pnpm to install InterfaceAgent.

- For Core, see [installation steps](./packages/core/README.md).
- For iOS, see [installation steps](./packages/ios/README.md).
- For Windows, see [installation steps](./packages/windows/README.md).

## 🚀 Challenges and Focus

Project InterfaceAgent continues to face challenges in long-horizon planning and selector inference accuracy. The current focus is on enhancing the stability of InterfaceAgent agents.

## 🤓 Contributing

We welcome contributions. Please follow the standard fork-and-pull request workflow for your contributions.

## 🛂 License

InterfaceAgent is licensed under the [MIT License](LICENSE).

## 🚑 Support

For support, questions, or feature requests, open an issue in the GitHub repository.