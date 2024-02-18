import {
  AzureAIInput,
  // NLAction,
  OpenAIInput,
  // NavAIGuidePage,
  NavAIGuideAgent
} from "@navaiguide/core";
// import { tryAsyncEval } from "@navaiguide/core";
import { remote } from 'webdriverio';
import { getInstalledApps } from "./appium-ios-utils";

/**
 * The AppiumiOSAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
export class AppiumiOSAgent extends NavAIGuideAgent {
  private wdioBrowser: WebdriverIO.Browser;
  // private readonly runCodeActionMaxRetries = 3;
  private readonly appiumBaseUrl: string;
  private readonly appiumPort: number;
  private readonly iOSVersion: string;
  private readonly deviceUdid: string;

  /**
   * Constructs a new PlaywrightAgent instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs and Playwright page instance.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> & {
        configuration?: { organization?: string };
      } & {
        appiumBaseUrl: string;
        appiumPort: number;
        iOSVersion: string;
        deviceUdid: string;
      }
  ) {
    super(fields);
    this.appiumBaseUrl = fields?.appiumBaseUrl;
    this.appiumPort = fields?.appiumPort
    this.iOSVersion = fields?.iOSVersion;
    this.deviceUdid = fields?.deviceUdid;
  }

  /**
   * Runs the agent to achieve a specified end goal using a series of actions.
   * @param endGoal - The end goal to be achieved.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
  public async runAsync({ query }: { query: string }): Promise<string[][]> {

    // if go-ios not build throw error
    console.log(query);

    this.wdioBrowser = await this.initWdioAsync();

    // Get installed apps
    const apps = await getInstalledApps();
    console.log(apps);

    await this.wdioBrowser.activateApp("com.apple.Preferences");

    return [];

    // // Define the starting task: bing.com, bing.com/shopping
    // const startTask = await this.navAIGuide.classifyStartTask({
    //   endGoal: query,
    // });
    
    // console.log(`Starting at page: ${startTask.startPage}`);
    // await gotoWaitForTimeout(this.wdioBrowser, startTask.startPage, 5000);

    // let currentNavAIGuidePage = await NavAIGuidePage.fromPlaywrightAsync({
    //   page: this.wdioBrowser,
    // });

    // const actions: NLAction[] = [];
    // while (true) {
    //   const nextAction = await this.navAIGuide.predictNextNLAction({
    //     page: currentNavAIGuidePage,
    //     endGoal: query,
    //     previousActions: actions,
    //     mode: "visual",
    //   });

    //   console.log(`Predicted next probable action: ${nextAction.actionDescription}`);
    //   actions.push(nextAction);

    //   const codeActionResult = await this.navAIGuide.runCodeActionWithRetry({
    //     inputPage: currentNavAIGuidePage,
    //     endGoal: query,
    //     nextAction: nextAction,
    //     maxRetries: 3,
    //     codeEvalFunc: 
    //       async (code) => await tryAsyncEval({ page: this.wdioBrowser }, code),
    //   });

    //   if (!codeActionResult.success) {
    //     nextAction.actionSuccess = false;
    //     console.log(`The code action was unsuccessful after ${this.runCodeActionMaxRetries} retries.`);
    //     continue;
    //   }
    //   console.log(`The code action was successful.`);

    //   console.log(`Comparing page states before and after the action.`);
    //   const nextNavAIGuidePage = await NavAIGuidePage.fromPlaywrightAsync({
    //     page: this.wdioBrowser,
    //   });

    //   // Reasoning - Action Feedback
    //   const actionFeedbackReasoningResult =
    //     await this.navAIGuide.RunActionFeedbackReasoning({
    //       beforePage: currentNavAIGuidePage,
    //       afterPage: nextNavAIGuidePage,
    //       takenAction: nextAction,
    //     });

    //   if (
    //     !actionFeedbackReasoningResult ||
    //     !actionFeedbackReasoningResult.actionSuccess
    //   ) {
    //     console.log(`The action did not hold the expected results: ${actionFeedbackReasoningResult.pageStateChanges}.`);
    //     // TODO: Backtrack if no success + restore previous page state
    //     nextAction.actionSuccess = false;
    //     continue;
    //   }
    //   console.log(`The action held the expected results: ${actionFeedbackReasoningResult.pageStateChanges}.`);
      
    //   console.log(`Checking whether the goal was met.`);
    //   // Reasoning - Goal Check
    //   const {endGoalMet, relevantData } = await this.navAIGuide.RunGoalCheckReasoning({
    //     page: nextNavAIGuidePage,
    //     endGoal: query,
    //     newInformation: actionFeedbackReasoningResult.newInformation,
    //   });

    //   if (endGoalMet) {
    //     console.log(`Goal was met. Found relevant data:`);
    //     for (const data of relevantData) {
    //       if (data[0] && data[1]) {
    //         console.log(`${data[0]} - ${data[1]}`);
    //       }
    //     }
    //     return relevantData;
    //   }

    //   console.log(`Goal not met. Continuing to the next action.`);
    //   currentNavAIGuidePage = nextNavAIGuidePage;

    //   await this.wdioBrowser.deleteSession();
    // }
  }

  private async initWdioAsync(): Promise<WebdriverIO.Browser> {
    const wdioBrowser = await remote({
      baseUrl: this.appiumBaseUrl,
      port: this.appiumPort,
      capabilities: {
        platformName: "iOS",
        "appium:platformVersion": this.iOSVersion,
        "appium:deviceName": "(can be any value but must be present)",
        "appium:automationName": "XCUITest",
        "appium:udid": this.deviceUdid,
      }
    });
  
    return wdioBrowser;
  }
}
