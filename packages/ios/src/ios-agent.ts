import {
  AzureAIInput,
  NLAction,
  NavAIGuideBaseAgent,
  OpenAIInput,
} from "@navaiguide/core";
import { remote } from 'webdriverio';
import { getInstalledApps, navigateToAppAsync, isViewKeyboardVisible, isViewScrollable } from "./utils";
import { AppiumiOSNavAIGuidePage } from "./types";
import { sPrompt_Predict_Next_NL_Action } from "./prompts/predict-next-nl-action";
import { iOSActionHandler } from "./ios-action-handler";
import { sPrompt_App_Planner } from "./prompts/planner-apps";

/**
 * The iOSAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
export class iOSAgent extends NavAIGuideBaseAgent {
  private wdioClient: WebdriverIO.Browser;
  private readonly appiumBaseUrl: string;
  private readonly appiumPort: number;
  private readonly iOSVersion: string;
  private readonly deviceUdid: string;
  private iOSActionHandler: iOSActionHandler;

  /**
   * Constructs a new iOSAgent instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs and Appium configuration.
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
   * @param query - The query to be achieved.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
  public async runAsync({ query }: { query: string }): Promise<string[][]> {
    // TODO: if go-ios not build throw error

    // Initialize the Wdio client
    this.wdioClient = await this.initWdioAsync();

    // Get installed apps
    const apps = await getInstalledApps();
    console.log(`Found ${apps.length} installed apps: ${apps.map(app => app.title).join("\n")}`);

    const appsPlan = await this.navAIGuide.startTaskPlanner_Agent({
      prompt: sPrompt_App_Planner,
      userQuery: query,
      appsSource: apps,
    });

    console.log(`Generated plan with ${appsPlan.steps.length} steps: ${appsPlan.description}`);

    for (const appStep of appsPlan.steps) {
      console.log(`App: ${appStep.appId}, Goal: ${appStep.appEndGoal}`);
      await this.runAppStepAsync(appStep);
    }

    return [];
  }

  private async runAppStepAsync(appStep: { appId: string; appEndGoal: string }): Promise<string[][]> {

    console.log(`Starting at app: ${appStep.appId}`);
    await navigateToAppAsync(this.wdioClient, appStep.appId);

    await new Promise(resolve => setTimeout(resolve, 6000));

    let previousNavAIGuidePage: AppiumiOSNavAIGuidePage | null = null;
    let currentNavAIGuidePage = await AppiumiOSNavAIGuidePage.fromAppiumAsync({
      wdioClient: this.wdioClient,
      location: appStep.appId
    });

    // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);

    this.iOSActionHandler = new iOSActionHandler(this.wdioClient, this.navAIGuide);
    const actions: NLAction[] = [];
    while (true) {
      const nextAction = await this.navAIGuide.predictNextNLAction_Visual_Agent({
        prompt: sPrompt_Predict_Next_NL_Action,
        previousPage: previousNavAIGuidePage,
        currentPage: currentNavAIGuidePage,
        endGoal: appStep.appEndGoal,
        keyboardVisible: isViewKeyboardVisible(currentNavAIGuidePage.domContent),
        scrollable: isViewScrollable(currentNavAIGuidePage.domContent),
        previousActions: actions,
      });

      if (nextAction.previousActionSuccess != null) {
        console.log(`The previous action was ${nextAction.previousActionSuccess ? "" : "not " }successful: ${nextAction.previousActionSuccessExplanation}`);
      }

      console.log(`The end goal has ${nextAction.endGoalMet ? "" : "not " }been met: ${nextAction.endGoalMetExplanation}`);
      if (nextAction.endGoalMet) {
        return [];
      }

      console.log(`Predicted next probable action: ${nextAction.actionDescription}`);
      actions.push(nextAction);

      await this.iOSActionHandler.performAction(nextAction, currentNavAIGuidePage);

      // Delay for a few seconds to allow the action to take effect
      await new Promise(resolve => setTimeout(resolve, 4000));
      // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);

      const nextNavAIGuidePage = await AppiumiOSNavAIGuidePage.fromAppiumAsync({
        wdioClient: this.wdioClient,
        location: appStep.appId // Set again as the id of the app
      });

      previousNavAIGuidePage = currentNavAIGuidePage;
      currentNavAIGuidePage = nextNavAIGuidePage;
    }
  }

  private async initWdioAsync(): Promise<WebdriverIO.Browser> {
    const wdioBrowser = await remote({
      baseUrl: this.appiumBaseUrl,
      port: this.appiumPort,
      capabilities: {
        platformName: "iOS",
        "appium:newCommandTimeout": 50000,
        "appium:platformVersion": this.iOSVersion,
        "appium:deviceName": "(can be any value but must be set)",
        "appium:automationName": "XCUITest",
        "appium:udid": this.deviceUdid
      }
    });

    return wdioBrowser;
  }
}
