/**
 * Enum representing different OpenAI models.
 */
export declare enum OpenAIEnum {
    GPT35_TURBO = "gpt-3.5-turbo",
    GPT35_TURBO_16K = "gpt-3.5-turbo-16k",
    GPT4_TURBO = "gpt-4-1106-preview",
    GPT4_TURBO_VISION = "gpt-4-vision-preview"
}
/**
 * Class representing an OpenAI model.
 */
export declare class OpenAIModel {
    /**
     * The key of the OpenAI model.
     */
    key: string;
    /**
     * The value of the Azure AI model.
     */
    azureAIValue?: string;
    /**
     * The value of the OpenAI model.
     */
    openAIValue?: string;
    /**
     * Constructs a new instance of the OpenAIModel class.
     * @param key - The key of the model.
     * @param azureAIValue - The value of the Azure AI model.
     * @param openAIValue - The value of the OpenAI model.
     */
    constructor({ key, azureAIValue, openAIValue, }: {
        key: string;
        azureAIValue: string;
        openAIValue: string;
    });
}
/**
 * Class representing a collection of OpenAI models.
 */
export declare class OpenAIModels {
    private constructor();
    /**
     * A dictionary of OpenAI models.
     * The key is the model key, and the value is an instance of OpenAIModel.
     */
    static models: {
        [key: string]: OpenAIModel;
    };
    /**
     * Retrieves the OpenAI model with the specified key.
     * @param key - The key of the model to retrieve.
     * @returns The OpenAIModel instance corresponding to the specified key.
     */
    static getModel(key: string): OpenAIModel;
}
/**
 * Interface representing the input for OpenAI.
 */
export declare interface OpenAIInput {
    /**
     * The API key for OpenAI.
     */
    openAIApiKey?: string;
}
/**
 * Represents the input configuration for Azure AI.
 */
export declare interface AzureAIInput {
    /**
     * The version of the Azure AI API.
     */
    azureAIApiVersion?: string;
    /**
     * The API key for GPT-3.5 Turbo.
     */
    azureAIApiGpt35TurboKey?: string;
    /**
     * The API key for GPT-4 Turbo Vision.
     */
    azureAIApiGpt4TurboVisionKey?: string;
    /**
     * The instance name for GPT-3.5 Turbo.
     */
    azureAIApiGpt35TurboInstanceName?: string;
    /**
     * The instance name for GPT-4 Turbo Vision.
     */
    azureAIApiGpt4TurboVisionInstanceName?: string;
    /**
     * The deployment name for GPT-3.5 Turbo.
     */
    azureAIApiGpt35TurboDeploymentName?: string;
    /**
     * The deployment name for GPT-3.5 Turbo 16K.
     */
    azureAIApiGpt35Turbo16KDeploymentName?: string;
    /**
     * The deployment name for GPT-4 Turbo Vision.
     */
    azureAIApiGpt4TurboVisionDeploymentName?: string;
}
/**
 * Interface representing a message in the OpenAI response.
 */
export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface Error {
    message: string;
    type: string;
    param: string;
    code: string;
}
/**
 * Interface representing the OpenAI response.
 */
export interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: Usage;
    system_fingerprint: null;
    error: OpenAIError;
}
export declare class OpenAIError extends Error {
    code: string;
    constructor(message: string, code: string);
}
/**
 * Interface representing a choice in the OpenAI response.
 */
interface Choice {
    message: Message;
    finish_reason: string;
    index: number;
    logprobs: null;
}
/**
 * Interface representing the usage statistics in the OpenAI response.
 */
interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
/**
 * Interface representing the NL Starting Task.
 */
export interface StartTask {
    startPage: string;
}
/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * @property {string} location - The location of the page.
 * @property {PageScreen[]} screens - The screens of the page.
 * @property {string} domContent - The DOM content of the page.
 * @property {string} reducedDomContent - The reduced DOM content of the page.
 * @property {string[]} reducedDomChunks - The reduced DOM chunks of the page.
 */
export declare class NavAIGuidePage {
    location: string;
    screens: PageScreen[];
    domContent: string;
    reducedDomContent: string;
    reducedDomChunks: string[];
    /**
     * Creates a NavAIGuidePage instance.
     * @param {Object} params - The parameters for the NavAIGuidePage.
     * @param {string} params.location - The location of the page.
     * @param {PageScreen[]} params.screens - The screens of the page.
     * @param {string} params.domContent - The DOM content of the page.
     * @param {string} params.reducedDomContent - The reduced DOM content of the page.
     * @param {string[]} params.reducedDomChunks - The reduced DOM chunks of the page.
     */
    constructor({ location, screens, domContent, reducedDomContent, reducedDomChunks }: {
        location: string;
        screens: PageScreen[];
        domContent: string;
        reducedDomContent: string;
        reducedDomChunks: string[];
    });
    /**
     * Draws a watermark on the screens of the page.
     * @returns {Promise<NavAIGuidePage>} - The page with watermarked screens.
     */
    drawBeforeWatermarkAsync(): Promise<NavAIGuidePage>;
    /**
     * Draws a watermark on the screens of the page.
     * @returns {Promise<NavAIGuidePage>} - The page with watermarked screens.
     */
    drawAfterWatermarkAsync(): Promise<NavAIGuidePage>;
}
/**
 * Interface representing a NavAIGuide Page Screen.
 * This includes the metadata and the screenshot data in base64 format.
 * @property {string} metadata - The metadata of the screen.
 * @property {string} base64Value - The screenshot data in base64 format.
 * @property {string} base64ValueWithBeforeWatermark - The screenshot data with a "BEFORE" watermark.
 * @property {string} base64ValueWithAfterWatermark - The screenshot data with an "AFTER" watermark.
 * @property {ScreenSize} screenSize - The size of the screen.
 */
export interface PageScreen {
    metadata: string;
    base64Value: string;
    base64ValueWithBeforeWatermark: string;
    base64ValueWithAfterWatermark: string;
    screenSize: ScreenSize;
}
/**
 * Interface representing a Screen Size.
 * @property {number} width - The width of the screen.
 * @property {number} height - The height of the screen.
 */
export interface ScreenSize {
    width: number;
    height: number;
}
/**
 * Type alias representing a bounding box.
 */
export type BoundingBox = [number, number, number, number];
/**
 * Type alias for the type of actions available.
 */
export type ActionType = 'tap' | 'type' | 'scroll';
/**
 * Interface representing a source application.
 *
 * @property {string} id - The unique identifier of the application.
 * @property {string} title - The title of the application.
 * @property {string} description - A description of the application.
 */
export interface App {
    id: string;
    title: string;
    description?: string;
}
/**
 * Interface representing an Apps Plan.
 *
 * @property {string} description - The description of the plan.
 * @property {string} steps - A sequence of steps to be performed in the plan.
 */
export interface AppsPlan {
    description: string;
    steps: AppPlanStep[];
}
/**
 * Interface representing a Apps Plan Step.
 *
 * @property {string} appId - The application id.
 * @property {string} appEndGoal - The end goal to pursue in the application.
 */
export interface AppPlanStep {
    appId: string;
    appEndGoal: string;
}
/**
 * Interface representing a NavAIGuide Action in Natural Language.
 * @property {boolean | null} previousActionSuccess - Indicates if the previous action was successful.
 * @property {string} previousActionSuccessExplanation - Explanation of the success or failure of the previous action.
 * @property {boolean} endGoalMet - Indicates if the end goal was met.
 * @property {string} endGoalMetExplanation - Explanation of the end goal status.
 * @property {ActionType} actionType - The type of the action.
 * @property {string} actionTarget - The target of the action.
 * @property {string} actionDescription - The description of the action.
 * @property {string} actionInput - The input for the action.
 * @property {"up" | "down"} actionScrollDirection - The scroll direction for the action.
 * @property {string} actionExpectedOutcome - The expected outcome of the action.
 * @property {string} actionTargetVisualDescription - The visual description of the action target.
 * @property {string} actionTargetPositionContext - The position context of the action target.
 */
export interface NLAction {
    previousActionSuccess: boolean | null;
    previousActionSuccessExplanation: string;
    endGoalMet: boolean;
    endGoalMetExplanation: string;
    actionType: ActionType;
    actionTarget: string;
    actionDescription: string;
    actionInput: string;
    actionScrollDirection: "up" | "down";
    actionExpectedOutcome: string;
    actionTargetVisualDescription: string;
    actionTargetPositionContext: string;
}
/**
 * Interface representing a code selector with its relevance score.
 * @property {string} selector - The code selector.
 * @property {number} relevanceScore - The relevance score of the code selector.
 */
export interface CodeSelectorByRelevance {
    selector: string;
    relevanceScore: number;
}
export {};
