"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const https = __importStar(require("https"));
const types_1 = require("./types");
const utils_1 = require("./utils");
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
class OpenAIClient {
    /**
     * Constructs a new instance of the OpenAIClient class.
     * @param fields - The fields to initialize the OpenAIClient with.
     */
    constructor(fields) {
        Object.defineProperty(this, "openAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureAIApiGpt35TurboKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureAIApiGpt4TurboVisionKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureAIApiGpt35TurboInstanceName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureAIApiGpt4TurboVisionInstanceName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isOpenAI", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.openAIApiKey =
            fields?.openAIApiKey ?? (0, utils_1.getEnvironmentVariable)("OPENAI_API_KEY");
        this.azureAIApiGpt35TurboKey =
            fields?.azureAIApiGpt35TurboKey ??
                (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT35TURBO_KEY");
        this.azureAIApiGpt4TurboVisionKey =
            fields?.azureAIApiGpt4TurboVisionKey ??
                (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT4TURBOVISION_KEY");
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
                (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT35TURBO_INSTANCE_NAME");
        this.azureAIApiGpt4TurboVisionInstanceName =
            fields?.azureAIApiGpt4TurboVisionInstanceName ??
                (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT4TURBOVISION_INSTANCE_NAME");
        const azureOpenAIApiGpt35TurboDeploymentName = fields?.azureAIApiGpt35TurboDeploymentName ??
            (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT35TURBO_DEPLOYMENT_NAME");
        const azureOpenAIApiGpt35Turbo16KDeploymentName = fields?.azureAIApiGpt35Turbo16KDeploymentName ??
            (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT35TURBO16k_DEPLOYMENT_NAME");
        const azureOpenAIApiGpt4TurboVisionDeploymentName = fields?.azureAIApiGpt4TurboVisionDeploymentName ??
            (0, utils_1.getEnvironmentVariable)("AZURE_AI_API_GPT4TURBOVISION_DEPLOYMENT_NAME");
        types_1.OpenAIModels.getModel(types_1.OpenAIEnum.GPT35_TURBO).azureAIValue =
            azureOpenAIApiGpt35TurboDeploymentName;
        types_1.OpenAIModels.getModel(types_1.OpenAIEnum.GPT35_TURBO_16K).azureAIValue =
            azureOpenAIApiGpt35Turbo16KDeploymentName;
        types_1.OpenAIModels.getModel(types_1.OpenAIEnum.GPT4_TURBO_VISION).azureAIValue =
            azureOpenAIApiGpt4TurboVisionDeploymentName;
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
    async analyzeImage({ base64Images, systemPrompt, prompt, detailLevel = "auto", maxTokens, temperature, responseFormat, }) {
        return this.retryWithExponentialBackoff(async () => {
            const analyzeResponse = await this.analyzeImage_Internal({
                base64Images,
                systemPrompt,
                prompt,
                detailLevel,
                maxTokens,
                temperature,
            });
            const analyzeContent = analyzeResponse.choices[0].message.content;
            if (responseFormat === "text") {
                return analyzeResponse;
            }
            return await this.generateText({
                systemPrompt: "You are a helpful assistant returning valid JSON only.",
                prompt: `Return the following as valid JSON: ${analyzeContent}`,
                model: types_1.OpenAIEnum.GPT35_TURBO,
                responseFormat: "json_object",
                maxTokens: 4096,
                temperature: 0,
            });
        }, (error) => {
            return this.isOpenAI && error && error.message && error.message.includes('Rate limit reached') ||
                (error.code && error.code === '429');
        }, 5, // Max retries
        1000, // Initial delay in ms
        32000 // Max delay in ms
        );
    }
    async analyzeImage_Internal({ base64Images, systemPrompt, prompt, detailLevel = "auto", maxTokens, temperature, isVisionEnhancementEnabled = false, }) {
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
        const payload = {
            messages: messages,
            ...(maxTokens && { max_tokens: maxTokens }),
            ...(temperature && { temperature }),
            ...(this.isOpenAI && {
                model: types_1.OpenAIModels.models[types_1.OpenAIEnum.GPT4_TURBO_VISION].openAIValue,
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
                : `https://${this.azureAIApiGpt4TurboVisionInstanceName}.openai.azure.com/openai/deployments/${types_1.OpenAIModels.models[types_1.OpenAIEnum.GPT4_TURBO_VISION].azureAIValue}/chat/completions?api-version=2023-12-01-preview`;
            const req = https.request(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(this.isOpenAI
                        ? { Authorization: `Bearer ${this.openAIApiKey}` }
                        : { "api-key": this.azureAIApiGpt4TurboVisionKey }),
                },
            }, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", async () => {
                    const response = JSON.parse(data);
                    if (response.error) {
                        const err = new types_1.OpenAIError(response.error.message, response.error.code);
                        reject(err);
                    }
                    resolve(response);
                });
            });
            req.on("error", (e) => {
                reject(e);
            });
            req.write(JSON.stringify(payload));
            req.end();
        });
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
    async generateText({ systemPrompt, prompt, model, responseFormat = "text", maxTokens, temperature, }) {
        return this.retryWithExponentialBackoff(async () => {
            const generateTextResponse = await this.generateText_Internal({
                systemPrompt,
                prompt,
                model,
                responseFormat,
                maxTokens,
                temperature,
            });
            return generateTextResponse;
        }, (error) => {
            return this.isOpenAI && error && error.message && error.message.includes('Rate limit reached') ||
                (error.code && error.code === '429');
        }, 10, // Max retries
        1000, // Initial delay in ms
        32000 // Max delay in ms
        );
    }
    async generateText_Internal({ systemPrompt, prompt, model = types_1.OpenAIEnum.GPT35_TURBO, responseFormat = "text", maxTokens, temperature, }) {
        const payload = {
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
                            text: responseFormat === "json_object" &&
                                model === types_1.OpenAIEnum.GPT35_TURBO
                                ? `Return as valid JSON. Input: ${prompt}`
                                : prompt,
                        },
                    ],
                },
            ],
            ...(maxTokens && { max_tokens: maxTokens }),
            ...(temperature && { temperature }),
            ...(model === types_1.OpenAIEnum.GPT35_TURBO
                ? { response_format: { type: responseFormat } }
                : {}),
            ...(this.isOpenAI && { model: types_1.OpenAIModels.models[model].openAIValue }),
        };
        return new Promise((resolve, reject) => {
            const url = this.isOpenAI
                ? `https://api.openai.com/v1/chat/completions`
                : `https://${this.azureAIApiGpt35TurboInstanceName}.openai.azure.com/openai/deployments/${types_1.OpenAIModels.models[model].azureAIValue}/chat/completions?api-version=2023-12-01-preview`;
            const req = https.request(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(this.isOpenAI
                        ? { Authorization: `Bearer ${this.openAIApiKey}` }
                        : { "api-key": this.azureAIApiGpt35TurboKey }),
                },
            }, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", async () => {
                    const response = JSON.parse(data);
                    if (response.error) {
                        const err = new types_1.OpenAIError(response.error.message, response.error.code);
                        reject(err);
                    }
                    resolve(response);
                });
            });
            req.on("error", (e) => {
                reject(e);
            });
            req.write(JSON.stringify(payload));
            req.end();
        });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async retryWithExponentialBackoff(operation, shouldRetry, // Added a function to check if we should retry
    maxRetries = 5, retryDelay = 1000, maxDelay = 32000) {
        let retryCount = 0;
        const executeOperation = async () => {
            try {
                return await operation();
            }
            catch (error) {
                const canRetry = shouldRetry(error);
                if (!canRetry || retryCount >= maxRetries)
                    throw error; // Check if we should retry
                console.log(`Operation failed, retrying in ${retryDelay}ms. Error: ${error}`);
                await this.delay(retryDelay);
                // Prepare for the next retry
                retryCount++;
                retryDelay = Math.min(retryDelay * 2, maxDelay); // Exponential backoff with a cap
                return executeOperation(); // Retry operation
            }
        };
        return executeOperation();
    }
}
exports.OpenAIClient = OpenAIClient;
