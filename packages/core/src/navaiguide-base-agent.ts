import { NavAIGuide } from "./navaiguide";
import {
  AzureAIInput,
  OpenAIInput,
  ToolsetPlan,
} from "./types";

/**
 * The NavAIGuideBaseAgent class is an abstract class that provides a base for creating multi-modal agents that use the NavAIGuide framework to achieve a specified end goal using a series of actions.
 */
export abstract class NavAIGuideBaseAgent {
  protected navAIGuide: NavAIGuide;

  /**
   * Constructs a new NavAIGuideBaseAgent instance.
   * @param fields - Configuration fields including OpenAI and AzureAI inputs.
   */
  constructor(
    fields?: Partial<OpenAIInput> &
      Partial<AzureAIInput> & {
        configuration?: { organization?: string };
      }
  ) {
    this.navAIGuide = new NavAIGuide(fields);
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
}
