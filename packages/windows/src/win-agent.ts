import {
  AzureAIInput,
  NLAction,
  NavAIGuideBaseAgent,
  OpenAIInput,
  Tool,
  ToolsetPlan,
} from "@navaiguide/core";
import { sPrompt_Predict_Next_NL_Action_Visual } from "./prompts/predict-next-nl-action";
import { WindowsActionHandler } from "./win-action-handler";
import { sPrompt_Tools_Planner } from "./prompts/tools-planner";
import { getAllInstalledTools, launchToolAsync } from "./utils";
import { ToolsetMap, WindowsNavAIGuidePage } from "./types";

/**
 * The iOSAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
export class WindowsAgent extends NavAIGuideBaseAgent {
  private windowsActionHandler: WindowsActionHandler;
  private toolsetMap: ToolsetMap = new Map<string, Tool>();

  /**
   * Constructs a new WindowsAgent instance.
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

  public async initAsync(): Promise<void> {
    // Get installed tools
    this.toolsetMap = await getAllInstalledTools();
    console.log(`Found ${this.toolsetMap.size} installed tools.`);
  }

  /**
   * Runs the agent to achieve a specified end goal using a series of actions.
   * @param query - The query to be achieved.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
  public async runAsync({ query }: { query: string }): Promise<string[][]> {

    if (this.toolsetMap.size === 0) {
      throw new Error("No tools are installed or Agent has not been initialized.");
    }
   
    const plan = await this.navAIGuide.toolsPlanner_Agent({
      prompt: sPrompt_Tools_Planner,
      userQuery: query,
      tools: Array.from(this.toolsetMap.values()),
    });

    console.log(`Generated plan with ${plan.steps?.length ?? 0} steps: ${plan.description}`);

    return await this.runFromPlanAsync({ plan });
  }

   /**
   * Runs the agent to achieve a specified end goal using a series of actions.
   * @param query - The query to be achieved.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
   public async runFromPlanAsync({ plan }: { plan: ToolsetPlan }): Promise<string[][]> {

    if (this.toolsetMap.size === 0) {
      throw new Error("No tools are installed or Agent has not been initialized.");
    }

    for (const toolStep of plan.steps) {
      const tool = this.toolsetMap.get(toolStep.toolId);
      if (tool == null) {
        throw new Error(`Invalid tool ID: ${toolStep.toolId}`);
      }
      console.log(`App: ${toolStep.toolId}, Goal: ${toolStep.toolPrompt}`);
      await this.runToolStepAsync({ tool: tool, toolPrompt: toolStep.toolPrompt });
    }

    return [];
  }

  private async runToolStepAsync(toolStep: { tool: Tool; toolPrompt: string }): Promise<string[][]> {

    console.log(`Starting at tool: ${toolStep.tool.title}`);
    const winHandle = await launchToolAsync(toolStep.tool);

    await new Promise(resolve => setTimeout(resolve, 6000));

    let previousNavAIGuidePage: WindowsNavAIGuidePage | null = null;
    let currentNavAIGuidePage = await WindowsNavAIGuidePage.fromUIAutomationAsync({
      winHandle: winHandle,
      location: toolStep.tool.title,
      isVisualMode: true,
    });

    // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64Value);

    this.windowsActionHandler = new WindowsActionHandler(this.navAIGuide);
    const actions: NLAction[] = [];
    while (true) {
      let nextAction: NLAction;
      try {
        nextAction = await this.navAIGuide.predictNextNLAction_Visual_Agent({
          prompt: sPrompt_Predict_Next_NL_Action_Visual,
          previousPage: previousNavAIGuidePage,
          currentPage: currentNavAIGuidePage,
          toolPrompt: toolStep.toolPrompt,
          // scrollable: isViewScrollable(currentNavAIGuidePage.domContent),
          // scrollable: true,
          previousActions: actions,
        });
      }
      catch (error) {
        console.error("Error running tool step:", error);
        throw error;
      }
      
      if (nextAction.previousActionSuccess != null) {
        console.log(`The previous action was ${nextAction.previousActionSuccess ? "" : "not " }successful: ${nextAction.previousActionSuccessExplanation}`);
      }

      console.log(`The end goal has ${nextAction.toolPromptCompleted ? "" : "not " }been met: ${nextAction.toolPromptCompletedExplanation}`);
      if (nextAction.toolPromptCompleted) {
        return [];
      }

      console.log(`Predicted next probable action: ${nextAction.actionDescription}`);
      actions.push(nextAction);

      await this.windowsActionHandler.performAction(nextAction, currentNavAIGuidePage);

      // Delay for a few seconds to allow the action to take effect
      await new Promise(resolve => setTimeout(resolve, 4000));
      // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64ValueWithBeforeWatermark);
      // saveBase64ImageToFile(currentNavAIGuidePage.screens[0].base64ValueWithAfterWatermark);

      const nextNavAIGuidePage = await WindowsNavAIGuidePage.fromUIAutomationAsync({
        winHandle: winHandle,
        location: toolStep.tool.title, // Set again as the id of the tool
        isVisualMode: true,
      });

      previousNavAIGuidePage = currentNavAIGuidePage;
      currentNavAIGuidePage = nextNavAIGuidePage;
    }
  }
}
