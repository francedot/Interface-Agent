import {
  AzureAIInput,
  NLAction,
  OSAgentBase,
  OpenAIInput,
  Tool,
  ToolsetPlan,
  ClaudeAIEnum,
  ClaudeAIInput
} from "@osagent/core";
import { sPrompt_Predict_Next_NL_Action_Visual } from "./prompts/predict-next-nl-action";
import { WindowsActionHandler } from "./win-action-handler";
import { sPrompt_Tools_Planner } from "./prompts/tools-planner";
import { getActiveWindowsAsync, getAllInstalledTools, launchToolAsync } from "./utils";
import { ToolsetMap, Window, WindowsOSAgentPage } from "./types";
import { sPrompt_Active_Windows } from "./prompts/window-detect";
import { WindowsOSAgentSettings } from "./win-settings";

/**
 * The WindowsAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
export class WindowsAgent extends OSAgentBase {
  private windowsActionHandler: WindowsActionHandler;
  private toolsetMap: ToolsetMap = new Map<string, Tool>();

  /**
   * Constructs a new WindowsAgent instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs and Appium configuration.
   */
  constructor(fields?: Partial<OpenAIInput> & Partial<AzureAIInput> & Partial<ClaudeAIInput> & {
    configuration?: {
        organization?: string;
    }
  }) {
    super(fields, WindowsOSAgentSettings.getInstance());
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

    let requestClarifyingInfo = true;
    let requestClarifyingInfoAnswer: string | null = null;
    let plan: ToolsetPlan;
    while (requestClarifyingInfo) {
      plan = await this.osAgentCore.toolsPlanner_Agent({
        prompt: sPrompt_Tools_Planner,
        userQuery: query,
        tools: Array.from(this.toolsetMap.values()),
      });

      requestClarifyingInfo = plan.requestClarifyingInfo;
      if (plan.requestClarifyingInfo) {
        try {
          requestClarifyingInfoAnswer = await this.requestClarifyingInfo(plan.requestClarifyingInfoQuestion);
        } catch (error) {
          console.error("Error handling clarifying info:", error);
        }
      }

      if (plan.steps == null || plan.steps.length === 0) {
        // throw new Error("No steps were generated in the plan.");
        continue;
      }
    }

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
    // Start-ApplicationAndCaptureHandles
    console.log(`Starting at tool: ${toolStep.tool.title}`);
    await launchToolAsync(toolStep.tool);

    const activeWindows = await getActiveWindowsAsync();
    const classifiedWindows = await this.windowDetect_Agent({
      prompt: sPrompt_Active_Windows,
      tool: toolStep.tool,
      activeWindows: activeWindows,
    });

    const mostRelevantWindow = classifiedWindows[0];
    console.log(`Focusing on window: ${mostRelevantWindow.title}`);

    let previousOSAgentPage: WindowsOSAgentPage | null = null;
    let currentOSAgentPage = await WindowsOSAgentPage.fromUIAutomationAsync({
      winHandle: mostRelevantWindow.handle.toString(),
      location: toolStep.tool.title,
      isVisualMode: true,
    });

    // saveBase64ImageToFile(currentOSAgentPage.screens[0].base64Value);

    this.windowsActionHandler = new WindowsActionHandler(this.osAgentCore);
    const actions: NLAction[] = [];
    let nextClarifyingInfoAnswer: string | null = null;
    while (true) {
      let nextAction: NLAction;
      try {
        nextAction = await this.osAgentCore.predictNextNLAction_Visual_Agent({
          prompt: sPrompt_Predict_Next_NL_Action_Visual,
          previousPage: previousOSAgentPage,
          currentPage: currentOSAgentPage,
          toolPrompt: toolStep.toolPrompt,
          previousActions: actions,
          ambiguityHandlingScore: this.ambiguityHandlingScore,
          clarifyingInfoAnswer: nextClarifyingInfoAnswer
        });
        console.log(JSON.stringify(nextAction, null, 6));
        actions.push(nextAction);
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

      console.log(`Predicted next probable action of type ${nextAction.actionType} against target ${nextAction.actionTarget}: ${nextAction.actionDescription}`);
      
      if (nextAction.relevantData) {
        const relevantDataStrings = Object.keys(nextAction.relevantData).map(key => `${key}: ${nextAction.relevantData[key]}`);
        const joinedRelevantData = relevantDataStrings.join(", ");
        console.log(`Found relevant data strings: ${joinedRelevantData}`);
      }
     
      nextClarifyingInfoAnswer = null; // Reset clarifying info answer
      if (nextAction.actionType === "wait" && nextAction.requestClarifyingInfo) {
        try {
          nextClarifyingInfoAnswer = await this.requestClarifyingInfo(nextAction.requestClarifyingInfoQuestion);
          continue; // Predict the next action with the clarifying info added
        } catch (error) {
          console.error("Error handling clarifying info:", error);
        }
      }

      await this.windowsActionHandler.performAction(nextAction, currentOSAgentPage);

      // saveBase64ImageToFile(currentOSAgentPage.screens[0].base64ValueWithBeforeWatermark);
      // saveBase64ImageToFile(currentOSAgentPage.screens[0].base64ValueWithAfterWatermark);

      const nextOSAgentPage = await WindowsOSAgentPage.fromUIAutomationAsync({
        winHandle: mostRelevantWindow.handle.toString(),
        location: toolStep.tool.title, // Set again as the id of the tool
        isVisualMode: true,
      });

      previousOSAgentPage = currentOSAgentPage;
      currentOSAgentPage = nextOSAgentPage;
    }
  }

  public async windowDetect_Agent({
    prompt,
    tool,
    activeWindows
  }: {
    prompt: string;
    tool: Tool;
    activeWindows?: Window[];
  }): Promise<Window[]> {
    const model = WindowsOSAgentSettings.getInstance().windowDetectModel;
    const aiClient = this.osAgentCore.getClientForAIModel(model);
    const classifyActiveWindowsResult = await aiClient.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        appTitle: tool.title,
        activeWindows,
      }),
      model: model.values[0], // TODO: Handle Azure AI
      seed: 923, // Reproducible output
      responseFormat: "json_object",
      temperature: 0,
    });

    let windows: Window[];
    try {
      const jsonResult = JSON.parse(classifyActiveWindowsResult.choices[0].message.content);
      windows = jsonResult.windows;
    } catch (e) {
      console.error("Parsed content is not valid JSON");
      throw e;
    }

    // Sort windows by relevance score
    windows.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return windows;
  }
}
