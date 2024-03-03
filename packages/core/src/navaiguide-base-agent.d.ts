import { NavAIGuide } from "./navaiguide";
import { AzureAIInput, OpenAIInput } from "./types";
/**
 * The NavAIGuideBaseAgent class is an abstract class that provides a base for creating multi-modal agents that use the NavAIGuide framework to achieve a specified end goal using a series of actions.
 */
export declare abstract class NavAIGuideBaseAgent {
    protected navAIGuide: NavAIGuide;
    /**
     * Constructs a new NavAIGuideBaseAgent instance.
     * @param fields - Configuration fields including OpenAI and AzureAI inputs.
     */
    constructor(fields?: Partial<OpenAIInput> & Partial<AzureAIInput> & {
        configuration?: {
            organization?: string;
        };
    });
    /**
     * Runs the agent to achieve a specified end goal using a series of actions.
     * @param endGoal - The end goal to be achieved.
     * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
     */
    abstract runAsync({ query }: {
        query: string;
    }): Promise<string[][]>;
}
