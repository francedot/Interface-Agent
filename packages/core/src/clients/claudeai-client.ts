import * as https from "https";
import { getEnvironmentVariable, retryWithExponentialBackoff } from "../utils";
import { AIClient } from "./ai-client";
import { AIError, AIModels, AIResponse, ClaudeAIEnum, ClaudeAIInput } from "../types";

export class ClaudeAIClient implements AIClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(fields?: Partial<ClaudeAIInput>) {
    this.apiKey = fields?.claudeAIApiKey || getEnvironmentVariable("CLAUDE_AI_API_KEY");
    this.apiUrl = "https://api.anthropic.com";
  }
  
  public async generateText({
    systemPrompt,
    prompt,
    model,
    responseFormat,
    seed,
    maxTokens = 4096,
    temperature,
  }: {
    systemPrompt: string;
    prompt: string;
    model: string;
    responseFormat?: "text" | "json_object";
    seed;
    maxTokens?: number;
    temperature?: number;
  }): Promise<any> {
    return retryWithExponentialBackoff(
      async () => {
        const generateTextResponse = await this.generateText_Internal({
          systemPrompt,
          prompt,
          model,
          responseFormat: "text",
          maxTokens,
          temperature,
        });

        if (responseFormat === "text") {
          return generateTextResponse;
        }

        const generateJsonTextResponse = await this.generateText_Internal({
          systemPrompt: "You are an AI assistant that converts the given input into valid JSON format. The assitant returns the JSON only.\n\nInput:\n",
          prompt: generateTextResponse.choices[0].message.content,
          model: ClaudeAIEnum.CLAUDE_3_HAIKU,
          responseFormat: "json_object",
          maxTokens,
          temperature,
        });

        return generateJsonTextResponse;
      },
      (error) => {
        return error && error.message && error.message.includes('Rate limit reached') ||
          (error.code && error.code === '429') || 
          (error.code && error.code === 'INVALID_JSON_RESPONSE') ||
          (error.code && error.code === 'NO_CONTENT_IN_RESPONSE');
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
  }): Promise<any> {
    const userMessages = [
      ...(prompt ? [ { type: "text", text: prompt, }] : []),
    ];
  
    const payload: any = {
      messages: [
        {
            "role": "user",
            "content": userMessages
        }
      ],
      model: AIModels.getModel(model).values[0],
      system: systemPrompt,
      ...(maxTokens && { max_tokens : maxTokens }),
      ...(temperature && { temperature }),
    };
  
    return new Promise((resolve, reject) => {
      const url = `${this.apiUrl}/v1/messages`;
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
            "anthropic-version": "2023-06-01",
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
              const err = new Error(response.error.message);
              reject(err);
            }
            if (!response || !response.content || response.content.length === 0) {
              console.log("No Response content");
              reject(new AIError("No content in response", "NO_CONTENT_IN_RESPONSE"));
            }
            if (responseFormat === "json_object") {
              try {
                const jsonContent = JSON.parse(response.content[0].text);
                if (jsonContent === undefined) {
                  const err = new AIError("Invalid JSON response", "INVALID_JSON_RESPONSE");
                  reject(err);
                }
              } catch (e) {
                const err = new AIError("Invalid JSON response", "INVALID_JSON_RESPONSE");
                reject(err);
              }
            }
            const adaptedResponse = this.convertResponse(response);
            resolve(adaptedResponse);
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
  
  public async analyzeImage({
    base64Images,
    systemPrompt,
    prompt,
    model,
    detailLevel = "auto",
    responseFormat,
    maxTokens = 4096,
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
  }): Promise<any> {
    return retryWithExponentialBackoff(
      async () => {
        const analyzeImageResponse = await this.analyzeImage_Internal({
          base64Images,
          systemPrompt,
          prompt,
          model,
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
          model: ClaudeAIEnum.CLAUDE_3_HAIKU,
          responseFormat: "json_object",
          maxTokens,
          temperature,
        });

        return generateJsonTextResponse;
      },
      (error) => {
        return error && error.message && error.message.includes('Rate limit reached') ||
          (error.code && error.code === '429') || 
          (error.code && error.code === 'INVALID_JSON_RESPONSE') ||
          (error.code && error.code === 'NO_CONTENT_IN_RESPONSE');
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
  }): Promise<any> {
    const userMessages = [
      ...(prompt ? [ { type: "text", text: responseFormat === "json_object" ? `Return only JSON output: ${prompt}` : prompt, }] : []),
      ...base64Images.map((image) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png", // Adjust the media type based on the image format
          data: image,
        },
      })),
    ];
  
    const payload: any = {
      messages: [
        {
            "role": "user",
            "content": userMessages
        }
      ],
      model: AIModels.getModel(model).values[0],
      system: systemPrompt,
      ...(maxTokens && { max_tokens : maxTokens }),
      ...(temperature && { temperature }),
    };
  
    return new Promise((resolve, reject) => {
      const url = `${this.apiUrl}/v1/messages`;
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", async () => {
            const response = JSON.parse(data);
            // console.log("Response: ", response);
            if (response.error) {
              const err = new Error(response.error.message);
              reject(err);
            }
            if (!response || !response.content || response.content.length === 0) {
              console.log("No Response content");
              reject(new AIError("No content in response", "NO_CONTENT_IN_RESPONSE"));
            }
            if (responseFormat === "json_object") {
              try {
                const jsonContent = JSON.parse(response.content[0].text);
                if (jsonContent === undefined) {
                  const err = new AIError("Invalid JSON response", "INVALID_JSON_RESPONSE");
                  reject(err);
                }
              } catch (e) {
                const err = new AIError("Invalid JSON response", "INVALID_JSON_RESPONSE");
                reject(err);
              }
            }
            const adaptedResponse = this.convertResponse(response);
            resolve(adaptedResponse);
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

  private convertResponse(response: any): AIResponse {
    return {
      id: response.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          message: {
            role: response.role,
            content: response.content[0].text,
          },
          finish_reason: response.stop_reason,
          index: 0,
          logprobs: null,
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      system_fingerprint: null,
      error: null,
    };
  }
}