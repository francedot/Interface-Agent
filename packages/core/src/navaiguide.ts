import { OpenAIClient } from "./openai-client";
import {
  AzureAIInput,
  OpenAIInput,
  NavAIGuidePage,
  OpenAIEnum,
  NLAction,
  CodeSelectorByRelevance,
  AppsPlan,
  App,
} from "./types";

/**
 * NavAIGuide is a class providing an unenforced agentic framework for guiding users through a series of natural language tasks to achieve a specified end goal.
 */
export class NavAIGuide {
  private client: OpenAIClient;

  /**
   * Constructs a new NavAIGuide instance with optional configuration for OpenAI and AzureAI clients.
   * @param fields - An object containing OpenAI and AzureAI input configurations, as well as any additional configuration parameters.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> & { configuration?: { organization?: string } }
  ) {
    this.client = new OpenAIClient(fields);
  }

  /**
   * An agent for building a plan of actions to achieve a specified user query, based on a given set of apps.
   * @param {Object} params - The parameters for the task planner agent.
   * @param {string} params.prompt - The system prompt.
   * @param {string} params.userQuery - The user query.
   * @param {App[]} params.appsSource - The source of the apps.
   * @returns {Promise<AppsPlan>} - An apps plan.
   */
  public async startTaskPlanner_Agent({
    prompt,
    userQuery,
    appsSource
  }: {
    prompt: string;
    userQuery: string;
    appsSource: string[];
  }): Promise<AppsPlan> {
    const generatePlanResult = await this.client.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        userQuery: userQuery,
        appsSource: appsSource
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0.0,
      seed: 923, // Reproducible output
    });

    let appsPlan: AppsPlan;
    try {
      appsPlan = JSON.parse(generatePlanResult.choices[0].message.content);
    } catch (e) {
      console.error("Parsed content is not valid JSON");
    }

    return appsPlan;
  }

  /**
   * An agent for predicting the next natural language action based on the current state of the system and the previous actions.
   * @param {Object} params - The parameters for the visual agent.
   * @param {string} params.prompt - The system prompt.
   * @param {NavAIGuidePage} [params.previousPage] - The previous page (optional).
   * @param {NavAIGuidePage} params.currentPage - The current page.
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
    endGoal,
    keyboardVisible = null,
    scrollable,
    previousActions,
  }: {
    prompt: string;
    previousPage?: NavAIGuidePage;
    currentPage: NavAIGuidePage;
    endGoal: string;
    keyboardVisible?: boolean;
    scrollable: boolean;
    previousActions?: NLAction[];
  }): Promise<NLAction> {

    // Make sure the screenshots are watermarked
    await Promise.all([
      previousPage ? previousPage.drawBeforeWatermarkAsync() : Promise.resolve(),
      currentPage.drawAfterWatermarkAsync()
    ]);

    const visualGroundingResult = await this.client.analyzeImage({
      base64Images: [
        ...(previousPage ? [previousPage.screens.map((screen) => screen.base64ValueWithBeforeWatermark)[0]] : []), // Only if not null we provide the previous page
        currentPage.screens.map((screen) => screen.base64ValueWithAfterWatermark)[0]
      ],
      systemPrompt: prompt,
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPage: currentPage.location,
        ...(keyboardVisible != null && { keyboardVisible: keyboardVisible }),
        scrollable: scrollable,
        ...(previousActions &&
          previousActions.length > 0 && { previousActions: previousActions }),
      }),
      detailLevel: "auto",
      responseFormat: "json_object",
      maxTokens: 1250,
      temperature: 0,
    });

    let nlAction: NLAction;
    try {
      nlAction = JSON.parse(visualGroundingResult.choices[0].message.content);
    } catch (e) {
      console.error("Parsed content is not valid JSON");
      throw e;
    }

    return nlAction;
  }

  /**
  * An agent for generating the code selectors for a given page and next action.
  * @param {Object} params - The parameters for the agent.
  * @param {string} params.prompt - The system prompt.
  * @param {NavAIGuidePage} params.inputPage - The input page.
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
    inputPage: NavAIGuidePage;
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
      for (const codeSelector of codeSelectors) {
        console.log(codeSelector);
      }

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
   * @param {NavAIGuidePage} params.page - The page.
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
    page: NavAIGuidePage;
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
    console.log(`Generated ${allCodeSelectorsByRelevance.length} probable code selectors by relevance: ${JSON.stringify(allCodeSelectorsByRelevance)}`);
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
    const generateCodeSelectorResult = await this.client.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        currentPageDom: chunk,
        actionType: nextAction.actionType,
        actionTarget: nextAction.actionTarget,
        actionDescription: nextAction.actionDescription,
        ...(selectorFailures &&
          selectorFailures.length > 0 && { selectorFailures: selectorFailures }),
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "text",
      temperature: 0.6, // Increased temperature to encourage more variation in code generation if any 'selectorFailures' feedback
    });

    const generateCodeSelectorJsonResult = await this.client.generateText({
      systemPrompt: "Return as valid JSON: ",
      prompt: generateCodeSelectorResult.choices[0].message.content,
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0,
    });

    let selectorsByRelevance: CodeSelectorByRelevance[];
    try {
      const codeSelectors = JSON.parse(
        generateCodeSelectorJsonResult.choices[0].message.content
      );
      selectorsByRelevance = codeSelectors.selectorsByRelevance
    } catch (e) {
      throw new Error("Parsed content is not valid JSON");
    }

    return selectorsByRelevance;
  }
}
