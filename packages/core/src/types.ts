import {  insertTextIntoImage } from "./utils";

export type AIModelEnum = ClaudeAIEnum | OpenAIEnum;

/**
 * Enum representing different ClaudeAI models.
 */
export enum ClaudeAIEnum {
  CLAUDE_3_HAIKU = "CLAUDE_3_HAIKU",
  CLAUDE_3_OPUS = "CLAUDE_3_OPUS",
  CLAUDE_3_SONNET = "CLAUDE_3_SONNET",
}

/**
 * Enum representing different OpenAI models.
 */
export enum OpenAIEnum {
  GPT35_TURBO = "GPT35_TURBO",
  GPT35_TURBO_16K = "GPT35_TURBO_16K",
  GPT4_TURBO = "GPT4_TURBO",
  GPT4_TURBO_VISION = "GPT4_TURBO_VISION",
}

/**
 * Class representing an OpenAI model.
 */
export class AIModel {

  constructor({ key, modelType, values }: { key: string, modelType: "OpenAI" | "ClaudeAI", values: string[] }) {
    this.key = key;
    this.modelType = modelType;
    this.values = values;
  }
  
  /**
   * The key of the AIModel model.
   */
  key: string;

  /**
   * The type of the AIModel model.
   */
  modelType: "OpenAI" | "ClaudeAI";

  /**
 * The values of the AIModel model.
 */
  values: string[];
}

/**
 * Class representing a collection of AI models.
 */
export class AIModels {
  private constructor() { }

  /**
   * A dictionary of AI models.
   * The key is the model key, and the value is an instance of OpenAIModel.
   */
  static models: { [key: string]: AIModel } = {
    // OpenAI Models
    [OpenAIEnum.GPT35_TURBO]: new AIModel({
      key: OpenAIEnum.GPT35_TURBO,
      modelType: "OpenAI",
      values: ["SET_BY_CALLER", "gpt-3.5-turbo-1106"]
    }),
    [OpenAIEnum.GPT35_TURBO_16K]: new AIModel({
      key: OpenAIEnum.GPT35_TURBO_16K,
      modelType: "OpenAI",
      values: ["SET_BY_CALLER", "gpt-3.5-turbo-16k"]
    }),
    [OpenAIEnum.GPT4_TURBO]: new AIModel({
      key: OpenAIEnum.GPT4_TURBO,
      modelType: "OpenAI",
      values: ["SET_BY_CALLER", "gpt-4-1106-preview"]
    }),
    [OpenAIEnum.GPT4_TURBO_VISION]: new AIModel({
      key: OpenAIEnum.GPT4_TURBO_VISION,
      modelType: "OpenAI",
      values: ["SET_BY_CALLER", "gpt-4-vision-preview"]
      // values: ["SET_BY_CALLER", "gpt-4-turbo-2024-04-09"]
      // 
    }),
    // ClaudeAI Models
    [ClaudeAIEnum.CLAUDE_3_HAIKU]: new AIModel({
      key: ClaudeAIEnum.CLAUDE_3_HAIKU,
      modelType: "ClaudeAI",
      values: ["claude-3-haiku-20240307"],
    }),
    [ClaudeAIEnum.CLAUDE_3_SONNET]: new AIModel({
      key: ClaudeAIEnum.CLAUDE_3_SONNET,
      modelType: "ClaudeAI",
      values: ["claude-3-sonnet-20240229"],
    }),
    [ClaudeAIEnum.CLAUDE_3_OPUS]: new AIModel({
      key: ClaudeAIEnum.CLAUDE_3_OPUS,
      modelType: "ClaudeAI",
      values: ["claude-3-opus-20240229"],
    }),
  };

  /**
   * Retrieves the AI model with the specified key.
   * @param key - The key of the model to retrieve.
   * @returns The OpenAIModel instance corresponding to the specified key.
   */
  static getModelFromEnumValue(aiModel: AIModelEnum): AIModel {
    // for (const key in AIModels.models) {
    //   console.log(key);
    // }

    return AIModels.models[aiModel];
  }

  static getModel(aiModelName: string): AIModel {
    // const enumValue = getAIModelEnumValueFromKey(aiModelName);
    return AIModels.models[aiModelName];
  }
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
 * Interface representing the input for ClaudeAI.
 */
export declare interface ClaudeAIInput {
  /**
   * The API key for ClaudeAI.
   */
  claudeAIApiKey?: string;
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
  param: string
  code: string
}

/**
 * Interface representing the OpenAI response.
 */
export interface AIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  system_fingerprint: null;
  error: AIError;
}

export class AIError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'APIError';
  }
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
 * Class representing a InterfaceAgent page as input to InterfaceAgent.
 * @property {string} location - The location of the page.
 * @property {PageScreen[]} screens - The screens of the page.
 * @property {string} domContent - The DOM content of the page.
 * @property {string} reducedDomContent - The reduced DOM content of the page.
 * @property {string[]} reducedDomChunks - The reduced DOM chunks of the page.
 */
export class InterfaceAgentPage {
  location: string;
  screens: PageScreen[];
  domContent: string;
  reducedDomContent: string;
  reducedDomChunks: string[];
  minimizedDomContent?: string;

  /**
   * Creates a InterfaceAgentPage instance.
   * @param {Object} params - The parameters for the InterfaceAgentPage.
   * @param {string} params.location - The location of the page.
   * @param {PageScreen[]} params.screens - The screens of the page.
   * @param {string} params.domContent - The DOM content of the page.
   * @param {string} params.reducedDomContent - The reduced DOM content of the page.
   * @param {string[]} params.reducedDomChunks - The reduced DOM chunks of the page.
   */
  constructor({
    location,
    screens,
    domContent,
    reducedDomContent,
    reducedDomChunks,
    minimizedDomContent
  }: {
    location: string;
    screens: PageScreen[];
    domContent: string;
    reducedDomContent: string;
    reducedDomChunks: string[];
    minimizedDomContent?: string;
  }) {
    this.location = location;
    this.screens = screens;
    this.domContent = domContent;
    this.reducedDomContent = reducedDomContent;
    this.reducedDomChunks = reducedDomChunks;
    this.minimizedDomContent = minimizedDomContent;
  }

  /**
   * Draws a watermark on the screens of the page.
   * @returns {Promise<InterfaceAgentPage>} - The page with watermarked screens.
   */
  public async drawBeforeWatermarkAsync(): Promise<InterfaceAgentPage> {

    // Watermark the image with a BEFORE watermark
    await Promise.all(this.screens.map(async (screen) => {
      screen.base64ValueWithBeforeWatermark = await
        insertTextIntoImage(screen.base64Value, "BEFORE");
    }));

    return this;
  }

  /**
   * Draws a watermark on the screens of the page.
   * @returns {Promise<InterfaceAgentPage>} - The page with watermarked screens.
   */
  public async drawAfterWatermarkAsync(): Promise<InterfaceAgentPage> {

    // Watermark the image with a AFTER watermark
    await Promise.all(this.screens.map(async (screen) => {
      screen.base64ValueWithAfterWatermark = await
        insertTextIntoImage(screen.base64Value, "AFTER");
    }));

    return this;
  }

}

/**
 * Interface representing a InterfaceAgent Page Screen.
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
};

/**
 * Type alias representing a bounding box.
 */
export type BoundingBox = [number, number, number, number]; // [topLeftX, topLeftY, width, height]

/**
 * Type alias for the type of actions available.
 */
export type ActionType = 'tap' | 'type' | 'scroll' | 'nop';

/**
 * Interface representing a local tool.
 * 
 * @property {string} id - The unique identifier of the application.
 * @property {string} title - The title of the application.
 * @property {string} description - A description of the application.
 * @property {string} path - The path to the application, if applicable.
 */
export interface Tool {
  id: string;
  title: string;
  description?: string;
  path?: string;
  metadata?: string[];
  lastAccessTime?: Date;
  isWindowRef?: boolean;
}

/**
 * Interface representing a Tools Plan Step.
 * 
 * @property {string} appId - The application id.
 * @property {string} appEndGoal - The end goal to pursue in the application.
 */
export interface ToolStep {
  toolId: string;
  toolPrompt: string;
}

export type Toolset = Tool[];
export type ToolSteps = ToolStep[];

/**
 * Interface representing a Tools Plan.
 * 
 * @property {string} description - The description of the plan.
 * @property {string} steps - A sequence of steps to be performed in the plan.
 */
export interface ToolsetPlan {
  requestClarifyingInfo?: boolean;
  requestClarifyingInfoQuestion?: string;
  description: string;
  steps: ToolSteps;
}

/**
 * Interface representing a InterfaceAgent Action in Natural Language.
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
  toolPromptCompleted: boolean;
  toolPromptCompletedExplanation: string;
  actionType: string;
  actionTarget: string;
  // actionTargetBoundingBox: BoundingBox;
  actionDescription: string;
  actionInput: string;
  actionInputEditMode: "overwrite" | "append";
  actionScrollDirection: "up" | "down";
  actionExpectedOutcome: string;
  actionTargetVisualDescription: string;
  actionTargetPositionContext: string;
  requestClarifyingInfo: boolean;
  requestClarifyingInfoQuestion: string;
  relevantData: { [key: string]: string };
  revisedToolPrompt: string;
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

/**
 * Interface representing a Clarifying Info Event Arguments.
 */
export interface ClarifyingInfoEventArgs {
  message: string;
  callback: (response: string) => void;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}