import { getImageDimensionsFromBase64, insertTextIntoImage, reduceHtmlDomWithChunks } from "./utils";

/**
 * Enum representing different OpenAI models.
 */
export enum OpenAIEnum {
  GPT35_TURBO = "gpt-3.5-turbo",
  GPT35_TURBO_16K = "gpt-3.5-turbo-16k",
  GPT4_TURBO = "gpt-4-1106-preview",
  GPT4_TURBO_VISION = "gpt-4-vision-preview",
}

/**
 * Class representing an OpenAI model.
 */
export class OpenAIModel {
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
  constructor({
    key,
    azureAIValue,
    openAIValue,
  }: {
    key: string;
    azureAIValue: string;
    openAIValue: string;
  }) {
    this.key = key;
    this.azureAIValue = azureAIValue;
    this.openAIValue = openAIValue;
  }
}

/**
 * Class representing a collection of OpenAI models.
 */
export class OpenAIModels {
  private constructor() {}

  /**
   * A dictionary of OpenAI models.
   * The key is the model key, and the value is an instance of OpenAIModel.
   */
  static models: { [key: string]: OpenAIModel } = {
    [OpenAIEnum.GPT35_TURBO]: new OpenAIModel({
      key: OpenAIEnum.GPT35_TURBO,
      azureAIValue: "SET_BY_CALLER",
      openAIValue: "gpt-3.5-turbo-1106",
    }),
    [OpenAIEnum.GPT35_TURBO_16K]: new OpenAIModel({
      key: OpenAIEnum.GPT35_TURBO_16K,
      azureAIValue: "SET_BY_CALLER",
      openAIValue: "gpt-3.5-turbo-16k",
    }),
    [OpenAIEnum.GPT4_TURBO]: new OpenAIModel({
      key: OpenAIEnum.GPT4_TURBO_VISION,
      azureAIValue: "SET_BY_CALLER",
      openAIValue: "gpt-4-1106-preview",
    }),
    [OpenAIEnum.GPT4_TURBO_VISION]: new OpenAIModel({
      key: OpenAIEnum.GPT4_TURBO_VISION,
      azureAIValue: "SET_BY_CALLER",
      openAIValue: "gpt-4-vision-preview",
    }),
  };

  /**
   * Retrieves the OpenAI model with the specified key.
   * @param key - The key of the model to retrieve.
   * @returns The OpenAIModel instance corresponding to the specified key.
   */
  static getModel(key: string): OpenAIModel {
    return OpenAIModels.models[key];
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

export class OpenAIError extends Error {
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
 * Interface representing the Bing Search Url.
 */
export interface SearchUrl {
  searchUrl: string;
}

/**
 * Class representing a NavAIGuide page as input to NavAIGuide.
 * This class encapsulates the details of a webpage including its URL, screenshots, and DOM content.
 */
export class NavAIGuidePage {
  location: string;
  screens: PageScreen[];
  domContent: string;
  reducedDomContent: string;
  reducedDomChunks: string[];
  pageSummary?: PageSummary

  /**
   * Creates a NavAIGuidePage instance.
   * @param location - The location of the page.
   * @param domContent - The DOM content of the page.
   * @param screens - An array of screenshots of the webpage in base64 format.
   * @param reduce - Optional: A flag to determine if DOM should be reduced for grounding.
   * @returns A Promise that resolves to a NavAIGuidePage instance.
   */
  static async createAsync({
    location,
    screens,
    domContent,
    reducedDomContent,
    reducedDomChunks
  }: {
    location: string;
    screens: PageScreen[];
    domContent: string;
    reducedDomContent: string
    reducedDomChunks: string[]
  }): Promise<NavAIGuidePage> {
    if (!domContent) {
      throw new Error("DOM content is null or empty");
    }

    screens[0].base64ValueWithBeforeWatermark = await insertTextIntoImage(screens[0].base64Value, "BEFORE");
    screens[0].base64ValueWithAfterWatermark = await insertTextIntoImage(screens[0].base64Value, "AFTER");
    // const screenSize = getImageDimensionsFromBase64(screens[0]); // Assuming screens of the same size
    // console.log(`Screen size: ${JSON.stringify(screenSize)}`);
    
    // const { reducedDomContent, chunks } = reduceHtmlDomWithChunks(domContent);
    
    return {
      location: location,
      screens: screens,
      domContent: domContent,
      reducedDomContent: reducedDomContent,
      reducedDomChunks: reducedDomChunks,
    };
  }
}

export interface ScreenSize {
  width: number;
  height: number;
};

export type BoundingBox = [number, number, number, number]; // [topLeftX, topLeftY, width, height]

/**
 * Interface representing a NavAIGuide Page Screen.
 * This includes the metadata and the screenshot data in base64 format.
 */
export interface PageScreen {
  metadata: string;
  base64Value: string;
  base64ValueWithBeforeWatermark: string;
  base64ValueWithAfterWatermark: string;
  screenSize: ScreenSize;
}

/**
 * Interface representing a NavAIGuide Page Summary.
 * This includes the website purpose, page topic, key elements, notable features.
 */
export interface PageSummary {
  appPurpose: string;
  pageTopic: string;
  keyElements: string[];
  notableFeatures: string[];
}

export interface ElementDetails {
  visualDescription: string;
  positionContext: string;
  coordinates: BoundingBox;
}

export type ActionType = 'tap' | 'type' | 'scroll';

/**
 * Interface representing an application.
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

export interface AppsPlan {
  description: string;
  steps: AppPlanStep[];
}

export interface AppPlanStep {
  appId: string;
  appEndGoal: string;
}

/**
 * Interface representing a NavAIGuide Action.
 * This includes details about the action to be performed on a specific page.
 */
export interface NLAction {
  previousActionSuccess: boolean | null;
  previousActionSuccessExplanation: string;
  endGoalMet: boolean;
  endGoalMetExplanation: string;
  actionType: ActionType;
  actionTarget: string;
  // actionTargetBoundingBox: BoundingBox;
  actionDescription: string;
  actionInput: string;
  actionScrollDirection: "up" | "down";
  actionExpectedOutcome: string;
  actionTargetVisualDescription: string;
  actionTargetPositionContext: string;
}

/**
 * Interface representing a code action.
 * It encapsulates the actual code to be executed as part of the action.
 */
export interface CodeSelectorByRelevance {
  selector: string;
  relevanceScore: number;
}

/**
 * Enum representing different types of coded frameworks.
 * This helps in categorizing the frameworks used in code actions.
 */
export enum CodedFrameworkType {
  Playwright,
  BrowserApi,
}

/**
 * Interface for representing the result of action feedback reasoning.
 * It includes details about the success of an action and any state changes or new information gathered.
 */
export interface ActionFeedbackReasoningResult {
  actionSuccess: boolean;
  pageStateChanges: string;
  newInformation: string;
}

/**
 * Interface for representing the result of a goal check reasoning process.
 * It determines if the end goal has been met and includes relevant data and descriptions.
 */
export interface GoalCheckReasoningResult {
  endGoalMet: boolean;
  relevantDataDescription: string;
  relevantData: string[][];
}
