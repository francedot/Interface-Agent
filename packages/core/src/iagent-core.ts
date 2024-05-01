import { AIClient } from "./clients/ai-client";
import { InterfaceAgentSettings } from "./iagent-settings";
import {
  InterfaceAgentPage,
  NLAction,
  CodeSelectorByRelevance,
  ToolsetPlan,
  Toolset,
  AIModel,
  QuestionAnswer,
} from "./types";

/**
 * InterfaceAgent is a class providing an unenforced agentic framework for guiding users through a series of natural language tasks to achieve a specified end goal.
 */
export class InterfaceAgentCore {

  private aiClients: AIClient[];
  private settings: InterfaceAgentSettings;

  /**
   * Constructs a new InterfaceAgent instance with optional configuration for OpenAI and AzureAI clients.
   * @param fields - An object containing OpenAI and AzureAI input configurations, as well as any additional configuration parameters.
   */
  constructor(aiClients: AIClient[], settings?: InterfaceAgentSettings) {
    this.aiClients = aiClients;
    this.settings = settings;
  }

  /**
   * An agent for building a plan of actions to achieve a specified user query, based on a given set of apps.
   * @param {Object} params - The parameters for the task planner agent.
   * @param {string} params.prompt - The system prompt.
   * @param {string} params.userQuery - The user query.
   * @param {Tool[]} params.toolset - The source of the apps.
   * @returns {Promise<ToolsPlan>} - An apps plan.
   */
  public async toolsPlanner_Agent({
    prompt,
    userQuery,
    tools,
    ambiguityHandlingScore,
    requestClarifyingInfoQA = null,
  }: {
    prompt: string;
    userQuery: string;
    tools: Toolset;
    ambiguityHandlingScore: number;
    requestClarifyingInfoQA?: QuestionAnswer[];
  }): Promise<ToolsetPlan> {
    const aiClient = this.getClientForAIModel(this.settings.toolsPlannerModel);
    const generatePlanResult = await aiClient.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        userQuery: userQuery,
        toolset: tools,
        ambiguityHandlingScore: ambiguityHandlingScore,
        requestClarifyingInfoQA
      }),
      model: this.settings.toolsPlannerModel.key,
      responseFormat: "json_object",
      temperature: 0.0,
      seed: 923, // Reproducible output
    });

    let toolsetPlan: ToolsetPlan;
    try {
      toolsetPlan = JSON.parse(generatePlanResult.choices[0].message.content);
    } catch (e) {
      console.error("Parsed content is not valid JSON");
    }

    return toolsetPlan;
  }

  /**
   * An agent for predicting the next natural language action based on the current state of the system and the previous actions.
   * @param {Object} params - The parameters for the visual agent.
   * @param {string} params.prompt - The system prompt.
   * @param {InterfaceAgentPage} [params.previousPage] - The previous page (optional).
   * @param {InterfaceAgentPage} params.currentPage - The current page.
   * @param {string} params.endGoal - The end goal.
   * @param {boolean} params.keyboardVisible - Indicates if the keyboard is visible.
   * @param {boolean} params.scrollable - Indicates if the page is scrollable.
   * @param {NLAction[]} [params.previousActions] - The previous actions (optional).
   * @returns {Promise<NLAction>} - The next natural language action.
   * @throws {Error} - Throws an error if the parsed content is not valid JSON.
   */
  public async predictNextNLAction_Visual_Agent({
    prompt,
    previousPage = null,
    currentPage,
    ambiguityHandlingScore,
    requestClarifyingInfoQA = null,
    toolPrompt,
    keyboardVisible = null,
    scrollable = null,
    previousActions,
  }: {
    prompt: string;
    previousPage?: InterfaceAgentPage;
    currentPage: InterfaceAgentPage;
    ambiguityHandlingScore: number;
    requestClarifyingInfoQA?: QuestionAnswer[];
    toolPrompt: string;
    keyboardVisible?: boolean;
    scrollable?: boolean;
    previousActions?: NLAction[];
  }): Promise<NLAction> {
    const aiClient = this.getClientForAIModel(this.settings.predictNextActionVisualModel);
    const maxRetries = 3; // Maximum number of retries
    let retryCount = 0;

    while (retryCount < maxRetries) {
      // Ensure the screenshots are watermarked
      await Promise.all([
        previousPage ? previousPage.drawBeforeWatermarkAsync() : Promise.resolve(),
        currentPage.drawAfterWatermarkAsync()
      ]);

      const visualGroundingResult = await aiClient.analyzeImage({
        base64Images: [
          ...(previousPage ? [previousPage.screens.map((screen) => screen.base64ValueWithBeforeWatermark)[0]] : []),
          currentPage.screens.map((screen) => screen.base64ValueWithAfterWatermark)[0]
        ],
        systemPrompt: prompt,
        prompt: JSON.stringify({
          toolPrompt: toolPrompt,
          currentPage: currentPage.location,
          ambiguityHandlingScore: ambiguityHandlingScore,
          ...(requestClarifyingInfoQA != null && { requestClarifyingInfoQA: requestClarifyingInfoQA }),
          ...(keyboardVisible != null && { keyboardVisible: keyboardVisible }),
          ...(scrollable && { scrollable: scrollable }),
          ...(previousActions && previousActions.length > 0 && { previousActions: previousActions }),
        }),
        model: this.settings.predictNextActionVisualModel.key,
        detailLevel: "auto",
        responseFormat: "json_object",
        maxTokens: 2500,
        temperature: 0,
      });

      let nlAction: NLAction;
      try {
        nlAction = JSON.parse(visualGroundingResult.choices[0].message.content);
        if (nlAction && nlAction.actionType !== undefined) {
          return nlAction; // Return successfully parsed and valid action
        }
        console.warn(`Retrying as actionType is undefined: Attempt ${retryCount + 1}`);
      } catch (e) {
        console.error("Parsed content is not valid JSON", e);
      }

      retryCount++; // Increment retry count
      if (retryCount === maxRetries) {
        throw new Error("Maximum retries reached with no valid actionType");
      }
    }
    
    throw new Error("Failed to obtain a valid NLAction");
  }

  /**
  * An agent for generating the code selectors for a given page and next action.
  * @param {Object} params - The parameters for the agent.
  * @param {string} params.prompt - The system prompt.
  * @param {InterfaceAgentPage} params.inputPage - The input page.
  * @param {NLAction} params.nextAction - The next action.
  * @param {number} params.maxRetries - The maximum number of retries.
  * @param {(code: string) => Promise<boolean>} params.codeEvalFunc - The function to evaluate the code.
  * @returns {Promise<Object>} - The result of the code selector generation, including success status, next action, and selector failures.
  */
  public async generateCodeSelectorsWithRetry_Agent({
    prompt,
    inputPage,
    nextAction,
    maxRetries,
    codeEvalFunc: evalCode
  }: {
    prompt: string;
    inputPage: InterfaceAgentPage;
    nextAction: NLAction;
    maxRetries: number;
    codeEvalFunc: (code: string) => Promise<boolean>;
  }) {
    const selectorFailures = [];
    let success = false;
    let retries = 0;
    let selector: string;

    while (!success && retries < maxRetries) {
      const codeSelectors = await this.generateCodeSelectors_Agent({
        prompt: prompt,
        page: inputPage,
        nextAction: nextAction,
        selectorFailures: selectorFailures,
      });
      console.log(`Generated ${codeSelectors.length} probable code selectors at retry ${retries}:`);
      // for (const codeSelector of codeSelectors) {
      //   console.log(codeSelector);
      // }

      for (const codeSelector of codeSelectors) {
        selector = codeSelector;
        success = await evalCode(selector);
        if (success) {
          break;
        } else {
          selectorFailures.push(codeSelector);
        }
      }

      if (!success) {
        retries++;
        console.log(`Code Selectors held no success. Retry ${retries} of ${maxRetries}.`);
      }
    }

    console.log(`Code selector '${selector}' was ${success ? "successful" : "unsuccessful"} with ${retries} retries.`);
    return { success, nextAction, selectorFailures };
  }

  /**
   * Generates code selectors for the agent.
   * @param {Object} params - The parameters for the agent.
   * @param {string} params.prompt - The system prompt.
   * @param {InterfaceAgentPage} params.page - The page.
   * @param {NLAction} params.nextAction - The next action.
   * @param {string[]} [params.selectorFailures] - The selector failures (optional).
   * @returns {Promise<string[]>} - The sorted code selectors.
   */
  public async generateCodeSelectors_Agent({
    prompt,
    page,
    nextAction,
    selectorFailures = null
  }: {
    prompt: string;
    page: InterfaceAgentPage;
    nextAction: NLAction;
    selectorFailures?: string[];
  }): Promise<string[]> {
    const codeSelectorsByRelevance = await Promise.all(
      page.reducedDomChunks.map((chunk) =>
        this.generateCodeSelectorsForChunk(
          prompt,
          chunk,
          nextAction,
          selectorFailures
        )
      )
    );

    const allCodeSelectorsByRelevance = codeSelectorsByRelevance.flat().filter((codeSelector) => codeSelector != null);
    // console.log(`Generated ${allCodeSelectorsByRelevance.length} probable code selectors by relevance: ${JSON.stringify(allCodeSelectorsByRelevance)}`);
    const sortedCodeSelectors =
      allCodeSelectorsByRelevance.sort(
        (a, b) => b.relevanceScore - a.relevanceScore)
        .map((codeSelector) => codeSelector.selector);

    return sortedCodeSelectors;
  }

  private async generateCodeSelectorsForChunk(
    prompt: string,
    chunk: string,
    nextAction: NLAction,
    selectorFailures?: string[]
  ): Promise<CodeSelectorByRelevance[]> {
    const aiClient = this.getClientForAIModel(this.settings.generateCodeSelectorModel);
    const generateCodeSelectorResult = await aiClient.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        currentPageDom: chunk,
        actionType: nextAction.actionType,
        actionTarget: nextAction.actionTarget,
        actionDescription: nextAction.actionDescription,
        ...(selectorFailures &&
          selectorFailures.length > 0 && { selectorFailures: selectorFailures }),
      }),
      model: this.settings.generateCodeSelectorModel.key,
      responseFormat: "json_object",
      temperature: 0.6, // Increased temperature to encourage more variation in code generation if any 'selectorFailures' feedback
    });

    let selectorsByRelevance: CodeSelectorByRelevance[];
    try {
      const codeSelectors = JSON.parse(
        generateCodeSelectorResult.choices[0].message.content
      );
      selectorsByRelevance = codeSelectors.selectorsByRelevance;
      const sorted = selectorsByRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore);
      console.log(JSON.stringify(sorted));
    } catch (e) {
      throw new Error("Parsed content is not valid JSON");
    }

    return selectorsByRelevance;
  }

  public getClientForAIModel(model: AIModel): AIClient {
    if (model.modelType === "OpenAI") {
      return this.aiClients[0];
    } else if (model.modelType === "ClaudeAI") {
      return this.aiClients[1];
    } else {
      throw new Error(`Model ${model} not found.`);
    }
  }
}
