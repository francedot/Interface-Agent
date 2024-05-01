import { AIClient } from "./clients/ai-client";
import { AIClientFactoryImpl } from "./clients/ai-client-factory";
import { InterfaceAgentCore as InterfaceAgentCore } from "./iagent-core";
import { InterfaceAgentSettings } from "./iagent-settings";
import {
  AzureAIInput,
  ClarifyingInfoEventArgs,
  ClaudeAIInput,
  OpenAIInput,
  ToolsetPlan,
} from "./types";

/**
 * The InterfaceAgentBase class is an abstract class that provides a base for creating multi-modal agents that use the InterfaceAgent framework to achieve a specified end goal using a series of actions.
 */
export abstract class InterfaceAgentBase {
  protected aiClients: AIClient[];
  protected settings: InterfaceAgentSettings;
  protected InterfaceAgentCore: InterfaceAgentCore;

  /**
   * Constructs a new InterfaceAgentBase instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> &
      Partial<ClaudeAIInput> & {
        configuration?: { organization?: string }
      },
      settings?: InterfaceAgentSettings
  ) {
    this.aiClients = [
      new AIClientFactoryImpl().createClient("OpenAI", fields),
      new AIClientFactoryImpl().createClient("ClaudeAI", fields),
    ];
    this.settings = settings;
    this.InterfaceAgentCore = new InterfaceAgentCore(this.aiClients, settings);
  }

  /**
   * Initializes the agent.
   */
  abstract initAsync({ }): Promise<void>;

  /**
   * Runs the agent to achieve a specified end goal using a series of actions.
   * @param endGoal - The end goal to be achieved.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
  abstract runAsync({ query }: { query: string }): Promise<string[][]>;

  /**
   * Runs the agent to achieve a specified end goal using a series of actions.
   * @param plan - The plan to be executed.
   * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
   */
  abstract runFromPlanAsync({ plan }: { plan: ToolsetPlan }): Promise<string[][]>;

  /**
   * Event handler for when the agent requires more information to proceed.
   * @param args - The event arguments containing the clarifying information requested.
   */
  public onClarifyingInfoRequested: (args: ClarifyingInfoEventArgs) => void;

  /**
   * Requests clarifying information from the user to proceed.
   * @param message - The message to display to the user.
   * @returns A promise resolving to the clarifying information provided by the user.
   */
  protected async requestClarifyingInfo(message: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Ensure there is a subscriber to the event before proceeding
      if (this.onClarifyingInfoRequested) {
        this.onClarifyingInfoRequested({
          message,
          callback: resolve, // Directly use resolve as the callback function
        });
      } else {
        reject(new Error("Clarifying information requested, but no handler is attached."));
      }
    });
  }
}
