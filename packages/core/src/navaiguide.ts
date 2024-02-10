import { OpenAIClient } from "./openai-client";
import {
  AzureAIInput,
  OpenAIInput,
  NavAIGuidePage,
  OpenAIEnum,
  StartTask as StartTask,
  CodeAction,
  NLAction,
  SearchUrl,
  PageSummary,
  ActionFeedbackReasoningResult,
  GoalCheckReasoningResult,
} from "./types";
import { sPrompt_Generate_Code_Action } from "./prompts/generate-code-action";
import { systemPrompt_Ground_WebPage_Aggregate, systemPrompt_Ground_WebPage_Chunk } from "./prompts/ground-webpage";
import { sPrompt_Classifier_Start_Task } from "./prompts/classifier-start-task";
import { sPrompt_Generate_Search_Query } from "./prompts/generate-search-query";
import { sPrompt_Predict_Next_NL_Action } from "./prompts/predict-next-nl-action";
import { sPrompt_Sort_Code_Actions_By_Relevance } from "./prompts/sort-relevant-code-actions";
import { sPrompt_Reasoning_Action_Feedback } from "./prompts/reasoning-action-feedback";
import { sPrompt_Reasoning_Goal_Check } from "./prompts/reasoning-goal-check";

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
    endGoal,
  }: {
    endGoal: string;
  }): Promise<StartTask> {
    const startTaskResult = await this.client.generateText({
      systemPrompt: sPrompt_Classifier_Start_Task,
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

    if (startTask.startPage === "https://www.bing.com") {
      const generateSearchQueryResult = await this.generateSearchUrl({
        endGoal,
      });
      startTask.startPage = generateSearchQueryResult.searchUrl;
      // Encode spaces only in the search query
      startTask.startPage = startTask.startPage.replaceAll(" ", "%20");
    }

    return startTask;
  }

  /**
   * Predicts the next natural language action based on the current page, end goal, and any previous actions.
   * This can be done either visually or textually based on the mode specified.
   * @param page - The current NavAIGuidePage object.
   * @param endGoal - The final objective or goal.
   * @param previousActions - An optional array of previous NLActions to consider for context.
   * @param mode - An optional mode specifying whether to infer tasks visually or textually. Defaults to 'textual'.
   * @returns A promise resolving to the next inferred NLAction.
   */
  public async predictNextNLAction({
    page,
    endGoal,
    previousActions,
    mode = "visual",
  }: {
    page: NavAIGuidePage;
    endGoal: string;
    previousActions?: NLAction[];
    mode?: "visual" | "textual";
  }): Promise<NLAction> {
    const result =
      mode === "visual"
        ? await this.predictNextNLAction_Visual({
            page,
            endGoal,
            previousActions,
          })
        : await this.predictNextNLAction_Textual({
            page,
            endGoal,
            previousActions,
          });

    return result;
  }

  /**
   * Generates coded actions based on a given natural language action and other contextual information.
   * The method selects the appropriate code generation prompt based on the specified coding framework.
   * @param page - The current NavAIGuidePage object.
   * @param endGoal - The final objective or goal.
   * @param nextAction - The next natural language action to be translated into code.
   * @param codeFrameworkType - An optional parameter specifying the coding framework. Defaults to Playwright.
   * @param previousActions - An optional array of previous NLActions for context.
   * @param codeFailures - An optional array of strings indicating any previous code failures.
   * @returns A promise resolving to the generated CodeAction.
   */
  public async generateCodeActions({
    page,
    endGoal,
    nextAction,
    previousActions = null,
    codeFailures = null,
    sortByRelevance = true
  }: {
    page: NavAIGuidePage;
    endGoal: string;
    nextAction: NLAction;
    previousActions?: NLAction[];
    codeFailures?: string[];
    sortByRelevance?: boolean;
  }): Promise<CodeAction[]> {

    const codeActions = await Promise.all(
      page.reducedDomChunks.map((chunk) =>
        this.generateCodeActionForChunk(
          chunk,
          endGoal,
          page.url,
          nextAction,
          previousActions,
          codeFailures
        )
      )
    );

    if (!sortByRelevance) {
      return codeActions;
    }

    const sortCodeActionsByRelevanceResult = await this.client.generateText({
      systemPrompt: sPrompt_Sort_Code_Actions_By_Relevance,
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPageUrl: page.url,
        nextAction: nextAction,
        codeSet: JSON.stringify(codeActions.map((codeAction) => codeAction.code)),
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0.6,
    });

    let codeByRelevance: string[];

    try {
      const parsedJson = JSON.parse(sortCodeActionsByRelevanceResult.choices[0].message.content);
      codeByRelevance = parsedJson.codeSetByRelevance as string[];
    } catch (error) {
      console.error("Parsed content is not valid JSON");
    }

    return codeByRelevance.map((code) => ({ code: code } as CodeAction));
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
  public async runCodeActionWithRetry({
    inputPage,
    endGoal,
    nextAction,
    maxRetries,
    codeEvalFunc: evalCode
  }: {
    inputPage: NavAIGuidePage;
    endGoal: string;
    nextAction: NLAction;
    maxRetries: number;
    codeEvalFunc: (code: string) => Promise<[boolean, any]>;
  }) {
    const codeFailures = [];
    let success = false;
    let retries = 0;
    let code: string;

    while (!success && retries < maxRetries) {
      const codeActions = await this.generateCodeActions({
        page: inputPage,
        endGoal: endGoal,
        nextAction: nextAction,
        codeFailures: codeFailures,
      });
      console.log(`Generated ${codeActions.length} probable code actions at retry ${retries}:`);
      for (const codeAction of codeActions) {
        console.log(codeAction.code);
      }

      for (const codeAction of codeActions) {
        code = codeAction.code;
        const result = evalCode(code);
        // const result = await tryAsyncEval({ page: this.plPage }, code);
        success = result[0] ?? false;
        if (success) {
          break;
        } else {
          codeFailures.push(code);
        }
      }

      if (!success) {
        retries++;
        console.log(`Code actions held no success. Retry ${retries} of ${maxRetries}.`);
      }
      nextAction.actionCode = code;
      nextAction.actionSuccess = success;
    }

    console.log(`Code action '${code}' was ${success ? "successful" : "unsuccessful"} with ${retries} retries.`);
    return { success, nextAction, codeFailures };
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
          beforePageUrl: beforePage.url,
          afterPageUrl: afterPage.url,
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
            currentPageUrl: page.url,
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

  /**
   * Generates a search query based on the given end goal.
   * @param endGoal - The final objective or goal specified in natural language.
   * @returns A promise resolving to a SearchQuery object representing the query to be used on Bing Search.
   */
  private async generateSearchUrl({
    endGoal,
  }: {
    endGoal: string;
  }): Promise<SearchUrl> {
    const startTaskResult = await this.client.generateText({
      systemPrompt: sPrompt_Generate_Search_Query,
      prompt: JSON.stringify({
        endGoal: endGoal,
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0.4,
      seed: 923, // Reproducible output
    });

    let searchQuery: SearchUrl;
    try {
      searchQuery = JSON.parse(startTaskResult.choices[0].message.content);
    } catch (e) {
      console.error("Parsed content is not valid JSON");
    }

    return searchQuery;
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
      systemPrompt: systemPrompt_Ground_WebPage_Chunk,
      prompt: JSON.stringify({
        pageUrl: page.url,
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
      systemPrompt: systemPrompt_Ground_WebPage_Aggregate,
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

  private async predictNextNLAction_Visual({
    page,
    endGoal,
    previousActions,
  }: {
    page: NavAIGuidePage;
    endGoal: string;
    previousActions?: NLAction[];
  }): Promise<NLAction> {
    const visualGroundingResult = await this.client.analyzeImage({
      base64Images: page.screens.map((screen) => screen.base64Value),
      systemPrompt: sPrompt_Predict_Next_NL_Action("visual"),
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPageUrl: page.url,
        ...(previousActions &&
          previousActions.length > 0 && { previousActions: previousActions }),
      }),
      detailLevel: "auto",
      responseFormat: "json_object",
      maxTokens: 1200,
      temperature: 0.4,
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

  private async predictNextNLAction_Textual({
    page,
    endGoal,
    previousActions,
  }: {
    page: NavAIGuidePage;
    endGoal: string;
    previousActions?: NLAction[];
  }): Promise<NLAction> {
    if (!page.pageSummary) {
      page.pageSummary = await this.generatePageSummary({ page }); 
    }
    const generateNextActionResult = await this.client.generateText({
      systemPrompt: sPrompt_Predict_Next_NL_Action("textual"),
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPageUrl: page.url,
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

  private async generateCodeActionForChunk(
    chunk: string,
    endGoal: string,
    currentPageUrl: string,
    nextAction: NLAction,
    previousActions?: NLAction[],
    codeFailures?: string[]
  ): Promise<CodeAction> {
    const generateCodeActionResult = await this.client.generateText({
      systemPrompt: sPrompt_Generate_Code_Action,
      prompt: JSON.stringify({
        endGoal: endGoal,
        currentPageUrl: currentPageUrl,
        currentPageDom: chunk,
        nextAction: nextAction,
        ...(previousActions &&
          previousActions.length > 0 && { previousActions: previousActions }),
        ...(codeFailures &&
          codeFailures.length > 0 && { codeFailures: codeFailures }),
      }),
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "text",
      temperature: 0.6, // Increased temperature to encourage more variation in code generation if any 'codeFailures' feedback
    });

    const generateCodeActionJsonResult = await this.client.generateText({
      systemPrompt: "Return as valid JSON: ",
      prompt: generateCodeActionResult.choices[0].message.content,
      model: OpenAIEnum.GPT35_TURBO,
      responseFormat: "json_object",
      temperature: 0,
    });

    let codeAction: CodeAction;
    try {
      codeAction = JSON.parse(
        generateCodeActionJsonResult.choices[0].message.content
      );
    } catch (e) {
      throw new Error("Parsed content is not valid JSON");
    }

    return codeAction;
  }
}
