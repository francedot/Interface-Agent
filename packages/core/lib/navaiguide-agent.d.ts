import { NavAIGuide } from "./navaiguide";
import { AzureAIInput, OpenAIInput } from "./types";
/**
 * The PlaywrightAgent class orchestrates the process of performing and reasoning about actions on a web page towards achieving a specified end goal.
 */
export declare abstract class NavAIGuideAgent {
    protected navAIGuide: NavAIGuide;
    /**
     * Constructs a new NavAIGuideAgent instance.
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
