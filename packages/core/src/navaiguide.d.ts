import { AzureAIInput, OpenAIInput, NavAIGuidePage, NLAction, AppsPlan, App } from "./types";
/**
 * NavAIGuide is a class providing an unenforced agentic framework for guiding users through a series of natural language tasks to achieve a specified end goal.
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
     * An agent for building a plan of actions to achieve a specified user query, based on a given set of apps.
     * @param {Object} params - The parameters for the task planner agent.
     * @param {string} params.prompt - The system prompt.
     * @param {string} params.userQuery - The user query.
     * @param {App[]} params.appsSource - The source of the apps.
     * @returns {Promise<AppsPlan>} - An apps plan.
     */
    startTaskPlanner_Agent({ prompt, userQuery, appsSource }: {
        prompt: string;
        userQuery: string;
        appsSource: App[];
    }): Promise<AppsPlan>;
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
    predictNextNLAction_Visual_Agent({ prompt, previousPage, currentPage, endGoal, keyboardVisible, scrollable, previousActions, }: {
        prompt: string;
        previousPage?: NavAIGuidePage;
        currentPage: NavAIGuidePage;
        endGoal: string;
        keyboardVisible: boolean;
        scrollable: boolean;
        previousActions?: NLAction[];
    }): Promise<NLAction>;
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
    generateCodeSelectorsWithRetry_Agent({ prompt, inputPage, nextAction, maxRetries, codeEvalFunc: evalCode }: {
        prompt: string;
        inputPage: NavAIGuidePage;
        nextAction: NLAction;
        maxRetries: number;
        codeEvalFunc: (code: string) => Promise<boolean>;
    }): Promise<{
        success: boolean;
        nextAction: NLAction;
        selectorFailures: any[];
    }>;
    /**
     * Generates code selectors for the agent.
     * @param {Object} params - The parameters for the agent.
     * @param {string} params.prompt - The system prompt.
     * @param {NavAIGuidePage} params.page - The page.
     * @param {NLAction} params.nextAction - The next action.
     * @param {string[]} [params.selectorFailures] - The selector failures (optional).
     * @returns {Promise<string[]>} - The sorted code selectors.
     */
    generateCodeSelectors_Agent({ prompt, page, nextAction, selectorFailures }: {
        prompt: string;
        page: NavAIGuidePage;
        nextAction: NLAction;
        selectorFailures?: string[];
    }): Promise<string[]>;
    private generateCodeSelectorsForChunk;
}
