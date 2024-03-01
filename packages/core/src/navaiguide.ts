import { OpenAIClient } from "./openai-client";
import {
  AzureAIInput,
  OpenAIInput,
  NavAIGuidePage,
  OpenAIEnum,
  StartTask,
  NLAction,
  PageSummary,
  ActionFeedbackReasoningResult,
  GoalCheckReasoningResult,
  CodeSelectorByRelevance,
  AppsPlan,
  App,
} from "./types";
import { systemPrompt_Ground_Page_Aggregate, systemPrompt_Ground_Page_Chunk,  } from "../prompts/ground-page";
import { sPrompt_Reasoning_Action_Feedback } from "../prompts/reasoning-action-feedback";
import { sPrompt_Reasoning_Goal_Check } from "../prompts/reasoning-goal-check";

/**
 * NavAIGuide is a class that uses OpenAI to infer natural language tasks from a web page.
 * It can infer tasks either visually or textually based on the given inputs and mode.
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
   * Classify a starting natural language task based on the given end goal.
   * @param endGoal - The final objective or goal specified in natural language.
   * @returns A promise resolving to a StartTask object representing the initial task inferred from the end goal.
   */
  public async classifyStartTask({
    prompt,
    endGoal
  }: {
    prompt: string;
    endGoal: string;
  }): Promise<StartTask> {
    const startTaskResult = await this.client.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        endGoal: endGoal,
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0.0,
      seed: 923, // Reproducible output
    });

    let startTask: StartTask;
    try {
      startTask = JSON.parse(startTaskResult.choices[0].message.content);
    } catch (e) {
      console.error("Parsed content is not valid JSON");
    }

    return startTask;
  }

  /**
   * Classify a starting natural language task based on the given end goal.
   * @param endGoal - The final objective or goal specified in natural language.
   * @returns A promise resolving to a StartTask object representing the initial task inferred from the end goal.
   */
  public async generatePlan({
    prompt,
    userQuery,
    appsSource
  }: {
    prompt: string;
    userQuery: string;
    appsSource: App[];
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
   * Predicts the next natural language action based on the current page, end goal, and any previous actions.
   * This can be done either visually or textually based on the mode specified.
   * @param page - The current NavAIGuidePage object.
   * @param endGoal - The final objective or goal.
   * @param previousActions - An optional array of previous NLActions to consider for context.
   * @returns A promise resolving to the next inferred NLAction.
   */
  public async predictNextNLAction_Visual({
    prompt,
    previousPage = null,
    currentPage,
    endGoal,
    keyboardVisible,
    scrollable,
    previousActions,
  }: {
    prompt: string;
    previousPage?: NavAIGuidePage;
    currentPage: NavAIGuidePage;
    endGoal: string;
    keyboardVisible: boolean;
    scrollable: boolean;
    previousActions?: NLAction[];
  }): Promise<NLAction> {
    const visualGroundingResult = await this.client.analyzeImage({
      base64Images: [
        ...(previousPage ? [previousPage.screens.map((screen) => screen.base64ValueWithBeforeWatermark)[0]] : []), // Only if not null we provide the previous page
        currentPage.screens.map((screen) => screen.base64ValueWithAfterWatermark)[0]
      ],
      systemPrompt: prompt,
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPage: currentPage.location,
        keyboardVisible: keyboardVisible,
        scrollable: scrollable,
        ...(previousActions &&
          previousActions.length > 0 && { previousActions: previousActions }),
      }),
      detailLevel: "auto",
      responseFormat: "json_object",
      maxTokens: 2500,
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
   * Predicts the next natural language action based on the current page, end goal, and any previous actions.
   * This can be done either visually or textually based on the mode specified.
   * @param page - The current NavAIGuidePage object.
   * @param endGoal - The final objective or goal.
   * @param previousActions - An optional array of previous NLActions to consider for context.
   * @returns A promise resolving to the next inferred NLAction.
   */
  public async predictNextNLAction_Textual({
    prompt,
    page,
    endGoal,
    previousActions,
  }: {
    prompt: string;
    page: NavAIGuidePage;
    endGoal: string;
    previousActions?: NLAction[];
  }): Promise<NLAction> {
    if (!page.pageSummary) {
      page.pageSummary = await this.generatePageSummary({ page }); 
    }
    const generateNextActionResult = await this.client.generateText({
      systemPrompt: prompt,
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPage: page.location,
        currentPageSummary: page.pageSummary,
        ...(previousActions &&
          previousActions.length > 0 && { previousActions: previousActions }),
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "text",
      temperature: 0.4,
    });

    const generateNextActionJsonResult = await this.client.generateText({
      systemPrompt: "Return as valid JSON: ",
      prompt: generateNextActionResult.choices[0].message.content,
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0,
    });

    let nlAction: NLAction;
    try {
      nlAction = JSON.parse(
        generateNextActionJsonResult.choices[0].message.content
      );
    } catch (e) {
      console.error("Parsed content is not valid JSON");
      throw e;
    }

    return nlAction;
  }

  /**
   * Generates coded actions based on a given natural language action and other contextual information.
   * The method selects the appropriate code generation prompt based on the specified coding framework.
   * @param page - The current NavAIGuidePage object.
   * @param endGoal - The final objective or goal.
   * @param nextAction - The next natural language action to be translated into code.
   * @param codeFrameworkType - An optional parameter specifying the coding framework. Defaults to Playwright.
   * @param previousActions - An optional array of previous NLActions for context.
   * @param selectorFailures - An optional array of strings indicating any previous code failures.
   * @returns A promise resolving to the generated CodeSelector.
   */
  public async generateCodeSelectors({
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

    // const sortCodeSelectorsByRelevanceResult = await this.client.generateText({
    //   systemPrompt: sPrompt_Sort_Code_Selectors_By_Relevance,
    //   prompt: JSON.stringify({
    //     actionType: nextAction.actionType,
    //     actionTarget: nextAction.actionTarget,
    //     actionDescription: nextAction.actionDescription,
    //     selectors: allCodeSelectorsByRelevance,
    //   }),
    //   model: OpenAIEnum.GPT35_TURBO,
    //   responseFormat: "json_object",
    //   temperature: 0.1,
    // });

    // let selectorsByRelevance: string[];

    // try {
    //   const parsedJson = JSON.parse(sortCodeSelectorsByRelevanceResult.choices[0].message.content);
    //   selectorsByRelevance = parsedJson.sortedSelectors as string[];

    //   if (!selectorsByRelevance) {
    //     console.error("codeByRelevance undefined");
    //     console.error("sortCodeSelectorsByRelevanceResult.choices[0].message.content: " + sortCodeSelectorsByRelevanceResult.choices[0].message.content);
    //     console.error("parsedJson: " + parsedJson);
    //   }

    // } catch (error) {
    //   console.error("Parsed content is not valid JSON");
    // }

    // console.log(`Selectors by relevance: ${selectorsByRelevance}`);
    // return selectorsByRelevance;
  }

  /**
   * Executes a code action with retries, based on the natural language action and the current page state.
   * @param inputPage - The current NavAIGuidePage state.
   * @param endGoal - The end goal for the action.
   * @param nextNLAction - The next natural language action to be executed.
   * @param maxRetries - Maximum number of retries for the code action.
   * @param codeEvalFunc - Reference to the code runner function.
   * @returns An object containing the success status, executed code, and code failures.
   */
  public async generateCodeSelectorsWithRetry({
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
      const codeSelectors = await this.generateCodeSelectors({
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
   * Performs reasoning about the feedback of an action by comparing the page states before and after the action.
   * @param beforePage - The page before the action.
   * @param afterPage - The page after the action.
   * @param takenAction - The NLAction that was taken.
   * @returns A promise resolving to an ActionFeedbackReasoningResult.
   */
  public async RunActionFeedbackReasoning({
    beforePage,
    afterPage,
    takenAction,
  }: {
    beforePage: NavAIGuidePage;
    afterPage: NavAIGuidePage;
    takenAction: NLAction;
  }): Promise<ActionFeedbackReasoningResult> {
   
    beforePage.pageSummary ??= await this.generatePageSummary({ page: beforePage });
    afterPage.pageSummary ??= await this.generatePageSummary({ page: afterPage });

    const actionFeedbackReasoningResultResponse =
      await this.client.generateText({
        systemPrompt: sPrompt_Reasoning_Action_Feedback,
        prompt: JSON.stringify({
          beforepageLocation: beforePage.location,
          afterpageLocation: afterPage.location,
          beforePageSummary: beforePage.pageSummary,
          afterPageSummary: afterPage.pageSummary,
          takenAction: takenAction,
        }),
        model: OpenAIEnum.GPT35_TURBO,
        responseFormat: "json_object",
        temperature: 0,
      });

    let actionFeedbackReasoningResult: ActionFeedbackReasoningResult;
    try {
      actionFeedbackReasoningResult = JSON.parse(
        actionFeedbackReasoningResultResponse.choices[0].message.content
      );
    } catch (e) {
      console.error("Parsed content is not valid JSON");
    }

    return actionFeedbackReasoningResult;
  }

  /**
   * Checks if the end goal has been met and identifies any relevant data based on the current page state.
   * @param endGoal - The end goal to be checked.
   * @param currentPageDom - The DOM content of the current page.
   * @param newInformation - New information obtained from the previous action.
   * @returns A promise resolving to a GoalCheckReasoningResult.
   */
  public async RunGoalCheckReasoning({
    page,
    endGoal,
    newInformation,
  }: {
    page: NavAIGuidePage;
    endGoal: string;
    newInformation: string;
  }): Promise<{ endGoalMet: boolean; relevantData: string[][] }> {
    const goalCheckReasoningResultResponses = await Promise.all(
      page.reducedDomChunks.map((chunk) =>
        this.client.generateText({
          systemPrompt: sPrompt_Reasoning_Goal_Check,
          prompt: JSON.stringify({
            endGoal: endGoal,
            currentPage: page.location,
            currentPageDomChunk: chunk,
            newInformation: newInformation,
          }),
          model: OpenAIEnum.GPT35_TURBO,
          responseFormat: "json_object",
          temperature: 0,
        })
      )
    );

    let endGoalMet = false;
    const relevantData: string[][] = [];
    for (const goalCheckReasoningResultResponse of goalCheckReasoningResultResponses) {
      let goalCheckReasoningResult: GoalCheckReasoningResult;
      try {
        goalCheckReasoningResult = JSON.parse(
          goalCheckReasoningResultResponse.choices[0].message.content
        );
        if (goalCheckReasoningResult.endGoalMet) {
          endGoalMet = true;
          for (const data of goalCheckReasoningResult.relevantData) {
            relevantData.push([data[0], data[1]]);
          }
        }
      } catch (e) {
        console.error("Parsed content is not valid JSON");
      }
    }

    return { endGoalMet, relevantData };
  }

  private async generatePageSummary({
    page
  }: {
    page: NavAIGuidePage;
  }): Promise<PageSummary> {
    const pageSummaries = await Promise.all(
      page.reducedDomChunks.map((chunk) => this.generatePageSummaryForChunk({ page, domChunk: chunk })));

    if (pageSummaries.length == 1) {
      return pageSummaries[0];
    }

    // Aggregate page summaries
    return await this.generatePageSummaryAggregate({ pageSummaries });
  }

  private async generatePageSummaryForChunk({
    page,
    domChunk
  }: {
    page: NavAIGuidePage;
    domChunk: string;
  }): Promise<PageSummary> {
    const generatePageSummaryForChunkResult = await this.client.generateText({
      systemPrompt: systemPrompt_Ground_Page_Chunk,
      prompt: JSON.stringify({
        pageLocation: page.location,
        pageDomChunk: domChunk,
      }),
      model: OpenAIEnum.GPT35_TURBO,
      temperature: 0, // Minimize changes in page grounding
      responseFormat: "json_object",
    });

    let pageSummary: PageSummary;
    try {
      pageSummary = JSON.parse(
        generatePageSummaryForChunkResult.choices[0].message.content
      );
    } catch (e) {
      throw new Error("Parsed content is not valid JSON");
    }

    return pageSummary;
  }

  private async generatePageSummaryAggregate({
    pageSummaries
  }: {
    pageSummaries: PageSummary[];
  }): Promise<PageSummary> {
    const generatePageSummaryAggregateResult = await this.client.generateText({
      systemPrompt: systemPrompt_Ground_Page_Aggregate,
      prompt: JSON.stringify({
        pageSummaries: pageSummaries,
      }),
      model: OpenAIEnum.GPT35_TURBO,
      temperature: 0, // Minimize changes in page grounding
      responseFormat: "json_object",
    });

    let pageSummary: PageSummary;
    try {
      pageSummary = JSON.parse(
        generatePageSummaryAggregateResult.choices[0].message.content
      );
    } catch (e) {
      throw new Error("Parsed content is not valid JSON");
    }

    return pageSummary;
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
