import { OSAgentCore as OSAgentCore } from "./osagent-core";
import {
  AzureAIInput,
  ClarifyingInfoEventArgs,
  OpenAIInput,
  ToolsetPlan,
} from "./types";
import { getEnvironmentVariable } from "./utils";

/**
 * The OSAgentBaseAgent class is an abstract class that provides a base for creating multi-modal agents that use the OSAgent framework to achieve a specified end goal using a series of actions.
 */
export abstract class OSAgentBase {
  protected osAgentCore: OSAgentCore;
  protected ambiguityHandlingScore: number;

  /**
   * Constructs a new OSAgentBaseAgent instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> & {
        configuration?: { organization?: string };
      }
  ) {
    this.osAgentCore = new OSAgentCore(fields);
    this.ambiguityHandlingScore =
      parseFloat(getEnvironmentVariable("AMBIGUITY_HANDLING_SCORE") ?? "0");
  }

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
