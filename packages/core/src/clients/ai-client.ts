import { AIResponse, OpenAIEnum } from "../types";

export interface AIClient {

    generateText({
        systemPrompt,
        prompt,
        model,
        responseFormat,
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
      }): Promise<AIResponse>;

    analyzeImage({
        base64Images,
        systemPrompt,
        prompt,
        model,
        detailLevel,
        maxTokens,
        temperature,
        responseFormat,
      }: {
        base64Images: string[];
        systemPrompt: string;
        prompt: string;
        model: string;
        detailLevel?: "low" | "high" | "auto";
        maxTokens?: number;
        temperature?: number;
        responseFormat?: "text" | "json_object";
      }): Promise<AIResponse>;
}