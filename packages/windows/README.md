# <img align="center" src="../../img/logo.png" width="27"> Agent-Windows


Explore how to build iOS AI agents with **InterfaceAgent-Windows**.

## 💻 Getting Started

### Prerequisites

- Follow the core [pre-requisites](../core/README.md).
- Windows 11 device as host for the AI Agent.

### Steps

#### 1. ⚡️ Install InterfaceAgent-Windows

You can choose to either clone the repository or use npm, yarn, or pnpm to install InterfaceAgent.

#### npm:
```bash
npm install @interface-agent/windows
```

#### Yarn:
```bash
yarn add @interface-agent/windows
```

#### 2. Run a Windows AI Agent

From your app code:

```typescript
import { iAgent } from "@interface-agent/windows";

const iAgent = new iOSAgent({
    // openAIApiKey: "YOUR_OPEN_AI_API_KEY", // Optional if set through process.env.OPEN_AI_API_KEY
});

const edgeTileQuery = "Help me download an app named EdgeTile from the Windows Store.";
await iAgent.runAsync({
    query: edgeTileQuery
});
```

A console demo environment can either be used:

- From the cloned repo: `yarn workspace "@interface-agent/core" build && yarn workspace "@interface-agent/windows" build && yarn workspace "@interface-agent/windows" console`

- From the installed npm package: `npm explore @interface-agent/windows -- npm run console`

## 🎬 Demos

```bash
1) User Query: Help me download an app named EdgeTile
```
<p align="center">
  <img align="center" width="1280" src="https://github.com/francedot/OS-Agent/assets/11706033/676218ad-c6db-4ada-8db2-72153131ac83" alt="EdgeTile demo">
</p>

```bash
2) User Query: Dropshipping products on Tiktok
```
<p align="center">
  <img align="center" width="1280" src="https://github.com/francedot/OS-Agent/assets/11706033/c57db0e4-cc5c-42db-9f1b-fb9bd0a1fb4c" alt="TikTok demo">
</p>
