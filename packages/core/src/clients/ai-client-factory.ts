import { AzureAIInput, ClaudeAIInput, OpenAIInput } from "../types";
import { ClaudeAIClient } from "./claudeai-client";
import { OpenAIClient } from "./openai-client";
import { AIClient } from "./ai-client";

export interface AIClientFactory {
  createClient(type: string): AIClient;
}

export class AIClientFactoryImpl implements AIClientFactory {
  createClient(type: string, fields?: Partial<OpenAIInput> &
    Partial<AzureAIInput> &  Partial<ClaudeAIInput> & { configuration?: { organization?: string } }): AIClient {
    switch (type) {
      case 'ClaudeAI':
        return new ClaudeAIClient(fields);
      case 'OpenAI':
        return new OpenAIClient(fields);
      default:
        throw new Error(`Invalid client type: ${type}`);
    }
  }
}