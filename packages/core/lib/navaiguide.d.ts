import { AzureAIInput, OpenAIInput, NavAIGuidePage, StartTask as StartTask, CodeAction, NLAction, ActionFeedbackReasoningResult } from "./types";
/**
 * NavAIGuide is a class that uses OpenAI to infer natural language tasks from a web page.
 * It can infer tasks either visually or textually based on the given inputs and mode.
 */
export declare class NavAIGuide {
    private client;
    /**
     * Constructs a new NavAIGuide instance with optional configuration for OpenAI and AzureAI clients.
     * @param fields - An object containing OpenAI and AzureAI input configurations, as well as any additional configuration parameters.
     */
    constructor(fields?: Partial<OpenAIInput> & Partial<AzureAIInput> & {
        configuration?: {
            organization?: string;
        };
    });
    /**
     * Classify a starting natural language task based on the given end goal.
     * @param endGoal - The final objective or goal specified in natural language.
     * @returns A promise resolving to a StartTask object representing the initial task inferred from the end goal.
     */
    classifyStartTask({ endGoal, }: {
        endGoal: string;
    }): Promise<StartTask>;
    /**
     * Predicts the next natural language action based on the current page, end goal, and any previous actions.
     * This can be done either visually or textually based on the mode specified.
     * @param page - The current NavAIGuidePage object.
     * @param endGoal - The final objective or goal.
     * @param previousActions - An optional array of previous NLActions to consider for context.
     * @param mode - An optional mode specifying whether to infer tasks visually or textually. Defaults to 'textual'.
     * @returns A promise resolving to the next inferred NLAction.
     */
    predictNextNLAction({ page, endGoal, previousActions, mode, }: {
        page: NavAIGuidePage;
        endGoal: string;
        previousActions?: NLAction[];
        mode?: "visual" | "textual";
    }): Promise<NLAction>;
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
    generateCodeActions({ page, endGoal, nextAction, previousActions, codeFailures, sortByRelevance }: {
        page: NavAIGuidePage;
        endGoal: string;
        nextAction: NLAction;
        previousActions?: NLAction[];
        codeFailures?: string[];
        sortByRelevance?: boolean;
    }): Promise<CodeAction[]>;
    /**
     * Executes a code action with retries, based on the natural language action and the current page state.
     * @param inputPage - The current NavAIGuidePage state.
     * @param endGoal - The end goal for the action.
     * @param nextNLAction - The next natural language action to be executed.
     * @param maxRetries - Maximum number of retries for the code action.
     * @param codeEvalFunc - Reference to the code runner function.
     * @returns An object containing the success status, executed code, and code failures.
     */
    runCodeActionWithRetry({ inputPage, endGoal, nextAction, maxRetries, codeEvalFunc: evalCode }: {
        inputPage: NavAIGuidePage;
        endGoal: string;
        nextAction: NLAction;
        maxRetries: number;
        codeEvalFunc: (code: string) => Promise<[boolean, any]>;
    }): Promise<{
        success: boolean;
        nextAction: NLAction;
        codeFailures: any[];
    }>;
    /**
     * Performs reasoning about the feedback of an action by comparing the page states before and after the action.
     * @param beforePage - The page before the action.
     * @param afterPage - The page after the action.
     * @param takenAction - The NLAction that was taken.
     * @returns A promise resolving to an ActionFeedbackReasoningResult.
     */
    RunActionFeedbackReasoning({ beforePage, afterPage, takenAction, }: {
        beforePage: NavAIGuidePage;
        afterPage: NavAIGuidePage;
        takenAction: NLAction;
    }): Promise<ActionFeedbackReasoningResult>;
    /**
     * Checks if the end goal has been met and identifies any relevant data based on the current page state.
     * @param endGoal - The end goal to be checked.
     * @param currentPageDom - The DOM content of the current page.
     * @param newInformation - New information obtained from the previous action.
     * @returns A promise resolving to a GoalCheckReasoningResult.
     */
    RunGoalCheckReasoning({ page, endGoal, newInformation, }: {
        page: NavAIGuidePage;
        endGoal: string;
        newInformation: string;
    }): Promise<{
        endGoalMet: boolean;
        relevantData: string[][];
    }>;
    /**
     * Generates a search query based on the given end goal.
     * @param endGoal - The final objective or goal specified in natural language.
     * @returns A promise resolving to a SearchQuery object representing the query to be used on Bing Search.
     */
    private generateSearchUrl;
    private generatePageSummary;
    private generatePageSummaryForChunk;
    private generatePageSummaryAggregate;
    private predictNextNLAction_Visual;
    private predictNextNLAction_Textual;
    private generateCodeActionForChunk;
}
