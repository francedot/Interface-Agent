import { AzureAIInput, OpenAIEnum, OpenAIInput, OpenAIResponse } from "./types";
/**
 * `OpenAIClient` is a class that provides methods for interacting with OpenAI and AzureAI API.
 * It supports operations like analyzing images and generating text.
 * The class uses API keys for authentication, which can be provided when constructing an instance of the class.
 *
 * @property {string} openAIApiKey - The API key for OpenAI.
 * @property {string} azureOpenAIApiGpt35TurboKey - The API key for Azure OpenAI GPT-3.5 Turbo.
 * @property {string} azureOpenAIApiGpt4TurboVisionKey - The API key for Azure OpenAI GPT-4 Turbo Vision.
 * @property {string} azureOpenAIApiInstanceName - The instance name for Azure OpenAI API.
 * @property {boolean} isOpenAI - A flag indicating whether the client is for OpenAI or Azure OpenAI.
 */
export declare class OpenAIClient {
    private openAIApiKey?;
    private azureAIApiGpt35TurboKey?;
    private azureAIApiGpt4TurboVisionKey?;
    private azureAIApiGpt35TurboInstanceName?;
    private azureAIApiGpt4TurboVisionInstanceName?;
    private isOpenAI;
    /**
     * Constructs a new instance of the OpenAIClient class.
     * @param fields - The fields to initialize the OpenAIClient with.
     */
    constructor(fields?: Partial<OpenAIInput> & Partial<AzureAIInput> & {
        configuration?: {
            organization?: string;
        };
    });
    /**
     * Analyzes an image and returns the analysis result.
     * @param base64Images - The base64 encoded images to analyze.
     * @param systemPrompt - The system prompt.
     * @param prompt - The prompt.
     * @param detailLevel - The detail level of the analysis.
     * @param maxTokens - The maximum number of tokens to generate.
     * @param temperature - The temperature to use for text generation.
     * @param responseFormat - The format of the response.
     * @returns A promise that resolves to the analysis result.
     */
    analyzeImage({ base64Images, systemPrompt, prompt, detailLevel, maxTokens, temperature, responseFormat, }: {
        base64Images: string[];
        systemPrompt: string;
        prompt?: string;
        detailLevel?: "low" | "high" | "auto";
        maxTokens?: number;
        temperature?: number;
        responseFormat?: "text" | "json_object";
    }): Promise<OpenAIResponse>;
    private analyzeImage_Internal;
    /**
     * Generates text based on the provided prompt.
     * @param systemPrompt - The system prompt.
     * @param prompt - The prompt.
     * @param model - The model to use for text generation.
     * @param responseFormat - The format of the response.
     * @param maxTokens - The maximum number of tokens to generate.
     * @param temperature - The temperature to use for text generation.
     * @returns A promise that resolves to the generated text.
     */
    generateText({ systemPrompt, prompt, model, responseFormat, maxTokens, temperature, }: {
        systemPrompt: string;
        prompt: string;
        model: OpenAIEnum;
        responseFormat?: "text" | "json_object";
        seed?: number;
        maxTokens?: number;
        temperature?: number;
    }): Promise<OpenAIResponse>;
    private generateText_Internal;
    private delay;
    private retryWithExponentialBackoff;
}
