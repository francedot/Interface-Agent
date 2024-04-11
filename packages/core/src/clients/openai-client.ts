import * as https from "https";
import {
  AIError,
  AzureAIInput,
  OpenAIEnum,
  OpenAIInput,
  AIResponse,
  AIModels,
} from "../types";
import { getEnvironmentVariable, retryWithExponentialBackoff } from "../utils";
import { AIClient } from "./ai-client";

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
export class OpenAIClient implements AIClient {
  private openAIApiKey?: string;
  private azureAIApiGpt35TurboKey?: string;
  private azureAIApiGpt4TurboVisionKey?: string;
  private azureAIApiGpt35TurboInstanceName?: string;
  private azureAIApiGpt4TurboVisionInstanceName?: string;
  private isOpenAI: boolean = false;

  /**
   * Constructs a new instance of the OpenAIClient class.
   * @param fields - The fields to initialize the OpenAIClient with.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> & { configuration?: { organization?: string } }
  ) {
    this.openAIApiKey =
      fields?.openAIApiKey ?? getEnvironmentVariable("OPENAI_API_KEY");
    this.azureAIApiGpt35TurboKey =
      fields?.azureAIApiGpt35TurboKey ??
      getEnvironmentVariable("AZURE_AI_API_GPT35TURBO_KEY");
    this.azureAIApiGpt4TurboVisionKey =
      fields?.azureAIApiGpt4TurboVisionKey ??
      getEnvironmentVariable("AZURE_AI_API_GPT4TURBOVISION_KEY");

    this.isOpenAI =
      this.azureAIApiGpt35TurboKey && this.azureAIApiGpt4TurboVisionKey
        ? false
        : this.openAIApiKey
        ? true
        : (() => {
            throw new Error("API key for OpenAI or Azure AI is required");
          })();

    this.azureAIApiGpt35TurboInstanceName =
      fields?.azureAIApiGpt35TurboInstanceName ??
      getEnvironmentVariable("AZURE_AI_API_GPT35TURBO_INSTANCE_NAME");

    this.azureAIApiGpt4TurboVisionInstanceName =
      fields?.azureAIApiGpt4TurboVisionInstanceName ??
      getEnvironmentVariable("AZURE_AI_API_GPT4TURBOVISION_INSTANCE_NAME");

    const azureOpenAIApiGpt35TurboDeploymentName =
      fields?.azureAIApiGpt35TurboDeploymentName ??
      getEnvironmentVariable("AZURE_AI_API_GPT35TURBO_DEPLOYMENT_NAME");

    const azureOpenAIApiGpt35Turbo16KDeploymentName =
      fields?.azureAIApiGpt35Turbo16KDeploymentName ??
      getEnvironmentVariable("AZURE_AI_API_GPT35TURBO16k_DEPLOYMENT_NAME");

    const azureOpenAIApiGpt4TurboVisionDeploymentName =
      fields?.azureAIApiGpt4TurboVisionDeploymentName ??
      getEnvironmentVariable("AZURE_AI_API_GPT4TURBOVISION_DEPLOYMENT_NAME");

    AIModels.getModel(OpenAIEnum.GPT35_TURBO).values[0] =
      azureOpenAIApiGpt35TurboDeploymentName;
    AIModels.getModel(OpenAIEnum.GPT35_TURBO_16K).values[0] =
      azureOpenAIApiGpt35Turbo16KDeploymentName;
    AIModels.getModel(OpenAIEnum.GPT4_TURBO_VISION).values[0] =
      azureOpenAIApiGpt4TurboVisionDeploymentName;
  }

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
  public async generateText({
    systemPrompt,
    prompt,
    model,
    responseFormat = "text",
    seed,
    maxTokens,
    temperature,
  }: {
    systemPrompt: string;
    prompt: string;
    model: string;
    responseFormat?: "text" | "json_object";
    seed?: number;
    maxTokens?: number;
    temperature?: number;
  }): Promise<AIResponse> {
    return retryWithExponentialBackoff(
      async () => {
        const generateTextResponse = await this.generateText_Internal({
          systemPrompt,
          prompt,
          model,
          responseFormat: "text",
          seed,
          maxTokens,
          temperature,
        });

        if (responseFormat === "text") {
          return generateTextResponse;
        }

        const generateJsonTextResponse = await this.generateText_Internal({
          systemPrompt: "You are an AI assistant that converts the given input into valid JSON format. The assitant returns the JSON only.\n\nInput:\n",
          prompt: generateTextResponse.choices[0].message.content,
          model: OpenAIEnum.GPT35_TURBO,
          responseFormat: "json_object", // Only Set for GPT-3.5 Turbo
          seed,
          maxTokens,
          temperature,
        });

        return generateJsonTextResponse;
      },
      (error) => {
        return this.isOpenAI && error && error.message && error.message.includes('Rate limit reached') ||
          (error.code && error.code === '429')
      },
      10, // Max retries
      1000, // Initial delay in ms
      32000 // Max delay in ms
    );
  }

  private async generateText_Internal({
    systemPrompt,
    prompt,
    model,
    responseFormat,
    seed,
    maxTokens,
    temperature,
  }: {
    systemPrompt: string;
    prompt: string;
    model: string;
    responseFormat?: "text" | "json_object";
    seed?: number;
    maxTokens?: number;
    temperature?: number;
  }): Promise<AIResponse> {
    const payload: any = {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      ...(maxTokens && { max_tokens: maxTokens }),
      ...(temperature && { temperature }),
      ...(model === OpenAIEnum.GPT35_TURBO
        ? { response_format: { type: responseFormat } }
        : {}),
      ...(this.isOpenAI && { model: AIModels.getModel(model).values[1] }),
    };

    return new Promise((resolve, reject) => {
      const url = this.isOpenAI
        ? `https://api.openai.com/v1/chat/completions`
        : `https://${this.azureAIApiGpt35TurboInstanceName}.openai.azure.com/openai/deployments/${AIModels.getModel(model).values[0]}/chat/completions?api-version=2023-12-01-preview`;
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.isOpenAI
              ? { Authorization: `Bearer ${this.openAIApiKey}` }
              : { "api-key": this.azureAIApiGpt35TurboKey }),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", async () => {
            const response = JSON.parse(data);
            if (response.error) {
              const err = new AIError(response.error.message, response.error.code);
              reject(err);
            }
            resolve(response);
          });
        }
      );

      req.on("error", (e) => {
        reject(e);
      });
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

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
  public async analyzeImage({
    base64Images,
    systemPrompt,
    prompt,
    model = OpenAIEnum.GPT4_TURBO_VISION,
    detailLevel = "auto",
    responseFormat,
    maxTokens,
    temperature,
    isVisionEnhancementEnabled = false,
  }: {
    base64Images: string[];
    systemPrompt: string;
    prompt: string;
    model: string;
    detailLevel?: "low" | "high" | "auto";
    responseFormat?: "text" | "json_object";
    maxTokens?: number;
    temperature?: number;
    isVisionEnhancementEnabled?: boolean;
  }): Promise<AIResponse> {
    return retryWithExponentialBackoff(
      async () => {
        const analyzeImageResponse = await this.analyzeImage_Internal({
          base64Images,
          systemPrompt,
          prompt,
          model,
          detailLevel,
          responseFormat: "text",
          maxTokens,
          temperature,
          isVisionEnhancementEnabled
        });
      
        if (responseFormat === "text") {
          return analyzeImageResponse;
        }

        const generateJsonTextResponse = await this.generateText_Internal({
          systemPrompt: "You are an AI assistant that converts the given input into valid JSON format. The assitant returns the JSON only.\n\nInput:\n",
          prompt: analyzeImageResponse.choices[0].message.content,
          model: OpenAIEnum.GPT35_TURBO,
          responseFormat: "json_object", // Only Set for GPT-3.5 Turbo
          maxTokens,
          temperature,
        });

        return generateJsonTextResponse;
      },
      (error) => {
        return this.isOpenAI && error && error.message && error.message.includes('Rate limit reached') ||
          (error.code && error.code === '429')
      },
      5, // Max retries
      1000, // Initial delay in ms
      32000 // Max delay in ms
    );
  }

  private async analyzeImage_Internal({
    base64Images,
    systemPrompt,
    prompt,
    model,
    detailLevel = "auto",
    responseFormat,
    maxTokens,
    temperature,
    isVisionEnhancementEnabled = false,
  }: {
    base64Images: string[];
    systemPrompt: string;
    prompt: string;
    model: string;
    detailLevel?: "low" | "high" | "auto";
    responseFormat?: "text" | "json_object";
    maxTokens?: number;
    temperature?: number;
    isVisionEnhancementEnabled?: boolean;
  }): Promise<AIResponse> {
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          ...(prompt ? [{ type: "text", text: prompt }] : []),
          ...base64Images.map((image) => ({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${image}`,
              detail: detailLevel,
            },
          })),
        ],
      },
    ];

    const payload: any = {
      messages: messages,
      ...(maxTokens && { max_tokens: maxTokens }),
      ...(temperature && { temperature }),
      ...(this.isOpenAI && {
        model: AIModels.getModel(model).values[1],
      }),
      ...(!this.isOpenAI &&
        isVisionEnhancementEnabled && {
          enhancements: {
            ocr: { enabled: true },
            grounding: { enabled: true },
          },
        }),
    };

    return new Promise((resolve, reject) => {
      const url = this.isOpenAI
        ? `https://api.openai.com/v1/chat/completions`
        : `https://${
            this.azureAIApiGpt4TurboVisionInstanceName
          }.openai.azure.com/openai/deployments/${
            AIModels.getModel(model).values[0]
          }/chat/completions?api-version=2023-12-01-preview`;
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.isOpenAI
              ? { Authorization: `Bearer ${this.openAIApiKey}` }
              : { "api-key": this.azureAIApiGpt4TurboVisionKey }),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", async () => {
            const response = JSON.parse(data);
            if (response.error) {
              const err = new AIError(response.error.message, response.error.code);
              reject(err);
            }
            resolve(response);
          });
        }
      );

      req.on("error", (e) => {
        reject(e);
      });
      req.write(JSON.stringify(payload));
      req.end();
    });
  }
}
