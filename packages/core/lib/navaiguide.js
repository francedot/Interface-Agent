"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavAIGuide = void 0;
const openai_client_1 = require("./openai-client");
const types_1 = require("./types");
const generate_code_action_1 = require("./prompts/generate-code-action");
const ground_webpage_1 = require("./prompts/ground-webpage");
const classifier_start_task_1 = require("./prompts/classifier-start-task");
const generate_search_query_1 = require("./prompts/generate-search-query");
const predict_next_nl_action_1 = require("./prompts/predict-next-nl-action");
const sort_relevant_code_actions_1 = require("./prompts/sort-relevant-code-actions");
const reasoning_action_feedback_1 = require("./prompts/reasoning-action-feedback");
const reasoning_goal_check_1 = require("./prompts/reasoning-goal-check");
/**
 * NavAIGuide is a class that uses OpenAI to infer natural language tasks from a web page.
 * It can infer tasks either visually or textually based on the given inputs and mode.
 */
class NavAIGuide {
    /**
     * Constructs a new NavAIGuide instance with optional configuration for OpenAI and AzureAI clients.
     * @param fields - An object containing OpenAI and AzureAI input configurations, as well as any additional configuration parameters.
     */
    constructor(fields) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = new openai_client_1.OpenAIClient(fields);
    }
    /**
     * Classify a starting natural language task based on the given end goal.
     * @param endGoal - The final objective or goal specified in natural language.
     * @returns A promise resolving to a StartTask object representing the initial task inferred from the end goal.
     */
    async classifyStartTask({ endGoal, }) {
        const startTaskResult = await this.client.generateText({
            systemPrompt: classifier_start_task_1.sPrompt_Classifier_Start_Task,
            prompt: JSON.stringify({
                endGoal: endGoal,
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0.0,
            seed: 923, // Reproducible output
        });
        let startTask;
        try {
            startTask = JSON.parse(startTaskResult.choices[0].message.content);
        }
        catch (e) {
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
    async predictNextNLAction({ page, endGoal, previousActions, mode = "visual", }) {
        const result = mode === "visual"
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
    async generateCodeActions({ page, endGoal, nextAction, previousActions = null, codeFailures = null, sortByRelevance = true }) {
        const codeActions = await Promise.all(page.reducedDomChunks.map((chunk) => this.generateCodeActionForChunk(chunk, endGoal, page.url, nextAction, previousActions, codeFailures)));
        if (!sortByRelevance) {
            return codeActions;
        }
        const sortCodeActionsByRelevanceResult = await this.client.generateText({
            systemPrompt: sort_relevant_code_actions_1.sPrompt_Sort_Code_Actions_By_Relevance,
            prompt: JSON.stringify({
                endGoal: endGoal,
                currentPageUrl: page.url,
                nextAction: nextAction,
                codeSet: JSON.stringify(codeActions.map((codeAction) => codeAction.code)),
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0.6,
        });
        let codeByRelevance;
        try {
            const parsedJson = JSON.parse(sortCodeActionsByRelevanceResult.choices[0].message.content);
            codeByRelevance = parsedJson.codeSetByRelevance;
        }
        catch (error) {
            console.error("Parsed content is not valid JSON");
        }
        return codeByRelevance.map((code) => ({ code: code }));
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
    async runCodeActionWithRetry({ inputPage, endGoal, nextAction, maxRetries, codeEvalFunc: evalCode }) {
        const codeFailures = [];
        let success = false;
        let retries = 0;
        let code;
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
                }
                else {
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
    async RunActionFeedbackReasoning({ beforePage, afterPage, takenAction, }) {
        beforePage.pageSummary ??= await this.generatePageSummary({ page: beforePage });
        afterPage.pageSummary ??= await this.generatePageSummary({ page: afterPage });
        const actionFeedbackReasoningResultResponse = await this.client.generateText({
            systemPrompt: reasoning_action_feedback_1.sPrompt_Reasoning_Action_Feedback,
            prompt: JSON.stringify({
                beforePageUrl: beforePage.url,
                afterPageUrl: afterPage.url,
                beforePageSummary: beforePage.pageSummary,
                afterPageSummary: afterPage.pageSummary,
                takenAction: takenAction,
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0,
        });
        let actionFeedbackReasoningResult;
        try {
            actionFeedbackReasoningResult = JSON.parse(actionFeedbackReasoningResultResponse.choices[0].message.content);
        }
        catch (e) {
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
    async RunGoalCheckReasoning({ page, endGoal, newInformation, }) {
        const goalCheckReasoningResultResponses = await Promise.all(page.reducedDomChunks.map((chunk) => this.client.generateText({
            systemPrompt: reasoning_goal_check_1.sPrompt_Reasoning_Goal_Check,
            prompt: JSON.stringify({
                endGoal: endGoal,
                currentPageUrl: page.url,
                currentPageDomChunk: chunk,
                newInformation: newInformation,
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0,
        })));
        let endGoalMet = false;
        const relevantData = [];
        for (const goalCheckReasoningResultResponse of goalCheckReasoningResultResponses) {
            let goalCheckReasoningResult;
            try {
                goalCheckReasoningResult = JSON.parse(goalCheckReasoningResultResponse.choices[0].message.content);
                if (goalCheckReasoningResult.endGoalMet) {
                    endGoalMet = true;
                    for (const data of goalCheckReasoningResult.relevantData) {
                        relevantData.push([data[0], data[1]]);
                    }
                }
            }
            catch (e) {
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
    async generateSearchUrl({ endGoal, }) {
        const startTaskResult = await this.client.generateText({
            systemPrompt: generate_search_query_1.sPrompt_Generate_Search_Query,
            prompt: JSON.stringify({
                endGoal: endGoal,
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0.4,
            seed: 923, // Reproducible output
        });
        let searchQuery;
        try {
            searchQuery = JSON.parse(startTaskResult.choices[0].message.content);
        }
        catch (e) {
            console.error("Parsed content is not valid JSON");
        }
        return searchQuery;
    }
    async generatePageSummary({ page }) {
        const pageSummaries = await Promise.all(page.reducedDomChunks.map((chunk) => this.generatePageSummaryForChunk({ page, domChunk: chunk })));
        if (pageSummaries.length == 1) {
            return pageSummaries[0];
        }
        // Aggregate page summaries
        return await this.generatePageSummaryAggregate({ pageSummaries });
    }
    async generatePageSummaryForChunk({ page, domChunk }) {
        const generatePageSummaryForChunkResult = await this.client.generateText({
            systemPrompt: ground_webpage_1.systemPrompt_Ground_WebPage_Chunk,
            prompt: JSON.stringify({
                pageUrl: page.url,
                pageDomChunk: domChunk,
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            temperature: 0, // Minimize changes in page grounding
            responseFormat: "json_object",
        });
        let pageSummary;
        try {
            pageSummary = JSON.parse(generatePageSummaryForChunkResult.choices[0].message.content);
        }
        catch (e) {
            throw new Error("Parsed content is not valid JSON");
        }
        return pageSummary;
    }
    async generatePageSummaryAggregate({ pageSummaries }) {
        const generatePageSummaryAggregateResult = await this.client.generateText({
            systemPrompt: ground_webpage_1.systemPrompt_Ground_WebPage_Aggregate,
            prompt: JSON.stringify({
                pageSummaries: pageSummaries,
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            temperature: 0, // Minimize changes in page grounding
            responseFormat: "json_object",
        });
        let pageSummary;
        try {
            pageSummary = JSON.parse(generatePageSummaryAggregateResult.choices[0].message.content);
        }
        catch (e) {
            throw new Error("Parsed content is not valid JSON");
        }
        return pageSummary;
    }
    async predictNextNLAction_Visual({ page, endGoal, previousActions, }) {
        const visualGroundingResult = await this.client.analyzeImage({
            base64Images: page.screens.map((screen) => screen.base64Value),
            systemPrompt: (0, predict_next_nl_action_1.sPrompt_Predict_Next_NL_Action)("visual"),
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
        let nlAction;
        try {
            nlAction = JSON.parse(visualGroundingResult.choices[0].message.content);
        }
        catch (e) {
            console.error("Parsed content is not valid JSON");
            throw e;
        }
        return nlAction;
    }
    async predictNextNLAction_Textual({ page, endGoal, previousActions, }) {
        if (!page.pageSummary) {
            page.pageSummary = await this.generatePageSummary({ page });
        }
        const generateNextActionResult = await this.client.generateText({
            systemPrompt: (0, predict_next_nl_action_1.sPrompt_Predict_Next_NL_Action)("textual"),
            prompt: JSON.stringify({
                endGoal: endGoal,
                currentPageUrl: page.url,
                currentPageSummary: page.pageSummary,
                ...(previousActions &&
                    previousActions.length > 0 && { previousActions: previousActions }),
            }),
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "text",
            temperature: 0.4,
        });
        const generateNextActionJsonResult = await this.client.generateText({
            systemPrompt: "Return as valid JSON: ",
            prompt: generateNextActionResult.choices[0].message.content,
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0,
        });
        let nlAction;
        try {
            nlAction = JSON.parse(generateNextActionJsonResult.choices[0].message.content);
        }
        catch (e) {
            console.error("Parsed content is not valid JSON");
            throw e;
        }
        return nlAction;
    }
    async generateCodeActionForChunk(chunk, endGoal, currentPageUrl, nextAction, previousActions, codeFailures) {
        const generateCodeActionResult = await this.client.generateText({
            systemPrompt: generate_code_action_1.sPrompt_Generate_Code_Action,
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
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "text",
            temperature: 0.6, // Increased temperature to encourage more variation in code generation if any 'codeFailures' feedback
        });
        const generateCodeActionJsonResult = await this.client.generateText({
            systemPrompt: "Return as valid JSON: ",
            prompt: generateCodeActionResult.choices[0].message.content,
            model: types_1.OpenAIEnum.GPT35_TURBO,
            responseFormat: "json_object",
            temperature: 0,
        });
        let codeAction;
        try {
            codeAction = JSON.parse(generateCodeActionJsonResult.choices[0].message.content);
        }
        catch (e) {
            throw new Error("Parsed content is not valid JSON");
        }
        return codeAction;
    }
}
exports.NavAIGuide = NavAIGuide;
