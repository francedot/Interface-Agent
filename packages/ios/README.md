# 🤖 NavAIGuide-iOS

Explore how to build iOS powered AI Agents with NavAIGuide-iOS.

## 💻 Getting Started

### Prerequisites

- Follow through the base [pre-requisites](../../README.md).
- macOS with Xcode 15.
- iOS device, simulators not supported
- [Apple Developer](https://developer.apple.com/programs/) Free Account.
- Go Build Tools (currently required as a dependency to go-ios)
- Appium Server with XCUITest Driver

### Steps

#### 1. ⚡️ Install NavAIGuide-iOS

You can use npm, yarn, or pnpm to install NavAIGuide

### npm:
```bash
  npm install @navaiguide/core && npm install @navaiguide/ios
```

### Yarn:
```bash
  yarn add @navaiguide/core && yarn add @navaiguide/ios
```

#### 2. Go-iOS Setup

Go-iOS is required in order for NavAIGuide to list the apps, and start a pre-installed WDA Runner on the target device. If your device is running iOS 17, support for waking up the WDA Runner is still experimental and npm packages aren't available for go-ios. Because of that, we need to install the latest from the [ios-17 branch](https://github.com/danielpaulus/go-ios/tree/ios-17) and build an executable manually, which requires installing the go build tools.

```bash
# Install the go build tools on macOS
brew install go
```

Once installed, you can run this utility script to build go-ios. This will copy the go-ios executable in the `./packages/ios/bin` directory, which is needed to run the next steps.

```bash
# Build the go-ios executable
npx run build-go-ios
```

#### 3. Appium

Install the Appium server globally:
```bash
npm install -g appium
```

Launching appium from terminal should result in a similar output:

<img src="../../img/appium-install.png" width="400">

Install and run `appium-doctor` for diagnosing and fixing any iOS configuration issues:
```bash
npm install -g @appium/doctor
appium-doctor --ios
```

Install the [Appium XCUITest Driver](https://github.com/appium/appium-xcuitest-driver/tree/master):
```bash
appium driver install xcuitest
```

This step will also clone the Appium [WebDriverAgent (WDA)](https://appium.github.io/appium-xcuitest-driver/4.16/wda-custom-server) Xcode project required at next step. Check that the Xcode project exists at `~/.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent`

#### 4. Enable Developer Settings & UI Automation

If haven't done already, enable [Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device) on your target device. Ig required reboot your phone.

Proceed next enabling UI Automation from Settings/Developer. This will allow the WDA Runner to command your device and execute XCUITests.

<img src="../../img/ios-ui-automation.jpeg" width="400">

#### 4. WDA Building and Signing

Next step is to build and sign the Appium WDA project through Xcode.

```bash
cd '~/.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent'
open 'WebDriverAgent.xcodeproj'
```

<img src="../../img/xcode-sign.png" width="400">

1. Select `WebDriverAgentRunner` from the target section.
2. Click on `Signing & Capabilities`.
3. Check the `Automatically manage signing` checkbox.
4. Choose your Team in the Team dropdown.
5. From `Bundle Identifier` replace the value with a bundle identifier of your choice. For ex : `com.<YOUR-ORG>.wda.runner`

Building the WDA project from Xcode is optional if you already have a prebuilt IPA, but it must be re-signed with your Apple developer account’s certificate. See Daniel Paulus' [wda-signer](https://github.com/danielpaulus/wda-signer) on instructions on how to do.

Next, to deploy and run the WDA runner on the target real device:

```bash
xcodebuild build-for-testing test-without-building -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination 'id=<YOUR_DEVICE_UDID>'
```

This step is only required once, as we will later use go-ios to wake up a previously installed WDA Runner in your device.

You can find your connected device UDID with go-ios.
```bash
./go-ios list
```

If the `xcodebuild` is successful, you should expect a WDA Runner app being installed, and your device entering into UI Automation mode (indicated by a watermark in your screen).
You can anytime exit of UI Automation mode holding Volume Up and Down at the same time.

```bash
npm run run-wda -- --WDA_BUNDLE_ID=com.example.bundleid --WDA_TEST_RUNNER_BUNDLE_ID=com.example.testrunner --DEVICE_UDID=12345
```

## What's what?

**Go-iOS**: A set of tools written in golang that allow you to control iOS devices on Linux and Windows. Most notably it includes the capability of starting and killing Apps and running UI-tests on iOS devices. It is using a reverse engineered version of the DTX Message Framework.

**WebDriverAgent (WDA)**: To automate tasks on an iOS device, installing WebDriverAgent (WDA) is required. WDA, initially a Facebook project and now maintained by Appium, acts as the core for all iOS automation tools and services. iOS's strict security prevents direct input simulations or screenshot captures via public APIs or shell commands. WebDriverAgent circumvents these limitations by launching an HTTP server on the device, turning XCUITest framework functions into accessible REST calls.

**UI Automation Mode**: This is the state triggered on the target device when running UI Automation XCUITests. It must be enabled through the Developer Settings before installing the WDA Runner App.

**Webdriverio**: WebDriverIO is an open-source testing utility for Node.js that enables developers to automate testing for web applications. In the context of UI automation, especially for iOS applications, WebDriverIO can be used alongside Appium, a mobile application automation framework. Appium serves as a bridge between WebDriverIO tests and the iOS platform, allowing tests written in WebDriverIO to interact with iOS applications as if a real user were using them. This integration supports the automation of both native and hybrid iOS apps.

**Appium**: Appium is an open-source, cross-platform test automation tool used for automating native, mobile web, and hybrid applications on iOS and Android platforms. Appium uses the WebDriver protocol to interact with iOS and Android applications. For iOS, it primarily relies on Apple's XCUITest framework (for iOS 9.3 and above), and for older versions, it used the UIAutomation framework. XCUITest is part of XCTest and is Apple's official UI testing framework, which Appium leverages to perform actions on the iOS UI.



