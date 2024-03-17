import {
  App,
  AzureAIInput,
  NLAction,
  NavAIGuideBaseAgent,
  OpenAIInput,
  saveBase64ImageToFile,
} from "@navaiguide/core";
import { sPrompt_Predict_Next_NL_Action } from "./prompts/predict-next-nl-action";
import { WindowsActionHandler } from "./win-action-handler";
import { sPrompt_App_Planner } from "./prompts/planner-apps";
import { getAllInstalledApps, launchAppAsync } from "./utils";
import { WindowsNavAIGuidePage } from "./types";

/**
 * The iOSAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
export class WindowsAgent extends NavAIGuideBaseAgent {
  private windowsActionHandler: WindowsActionHandler;

  /**
   * Constructs a new iOSAgent instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs and Appium configuration.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> & {
        configuration?: { organization?: string };
      }
  ) {
    super(fields);
  }

  /**
   * Runs the agent to achieve a specified end goal using a series of actions.
   * @param query - The query to be achieved.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
  public async runAsync({ query }: { query: string }): Promise<string[][]> {

    // Get installed apps
    const apps = await getAllInstalledApps();
    const appTitles = Array.from(apps.keys());
    console.log(`Found ${appTitles.length} installed apps: ${appTitles.join("\n")}`);

    const appsPlan = await this.navAIGuide.startTaskPlanner_Agent({
      prompt: sPrompt_App_Planner,
      userQuery: query,
      appsSource: appTitles,
    });

    console.log(`Generated plan with ${appsPlan.steps?.length ?? 0} steps: ${appsPlan.description}`);

    for (const appStep of appsPlan.steps) {
      const app = apps.get(appStep.appId);
      if (app == null) {
        throw new Error(`Invalid app ID: ${appStep.appId}`);
      }
      console.log(`App: ${appStep.appId}, Goal: ${appStep.appEndGoal}`);
      await this.runAppStepAsync({ app: app, appEndGoal: appStep.appEndGoal });
    }

    return [];
  }

  private async runAppStepAsync(appStep: { app: App; appEndGoal: string }): Promise<string[][]> {

    console.log(`Starting at app: ${appStep.app.title}`);
    const winHandle = await launchAppAsync(appStep.app);

    await new Promise(resolve => setTimeout(resolve, 6000));

    let previousNavAIGuidePage: WindowsNavAIGuidePage | null = null;
    let currentNavAIGuidePage = await WindowsNavAIGuidePage.fromUIAutomationAsync({
      winHandle: winHandle,
      location: appStep.app.title
    });

    saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);

    this.windowsActionHandler = new WindowsActionHandler(this.navAIGuide);
    const actions: NLAction[] = [];
    while (true) {
      const nextAction = await this.navAIGuide.predictNextNLAction_Visual_Agent({
        prompt: sPrompt_Predict_Next_NL_Action,
        previousPage: previousNavAIGuidePage,
        currentPage: currentNavAIGuidePage,
        endGoal: appStep.appEndGoal,
        // scrollable: isViewScrollable(currentNavAIGuidePage.domContent),
        scrollable: true,
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

      await this.windowsActionHandler.performAction(nextAction, currentNavAIGuidePage);

      // Delay for a few seconds to allow the action to take effect
      await new Promise(resolve => setTimeout(resolve, 4000));
      saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);

      const nextNavAIGuidePage = await WindowsNavAIGuidePage.fromUIAutomationAsync({
        winHandle: winHandle,
        location: appStep.app.title // Set again as the id of the app
      });

      previousNavAIGuidePage = currentNavAIGuidePage;
      currentNavAIGuidePage = nextNavAIGuidePage;
    }
  }
}
