import { AzureAIInput, NavAIGuideBaseAgent, OpenAIInput } from "@navaiguide/core";
/**
 * The iOSAgent class orchestrates the process of performing and reasoning about actions on a mobile screen towards achieving a specified end goal.
 */
export declare class iOSAgent extends NavAIGuideBaseAgent {
    private wdioClient;
    private readonly appiumBaseUrl;
    private readonly appiumPort;
    private readonly iOSVersion;
    private readonly deviceUdid;
    private iOSActionHandler;
    /**
     * Constructs a new iOSAgent instance.
     * @param fields - Configuration fields including OpenAI and AzureAI inputs and Appium configuration.
     */
    constructor(fields?: Partial<OpenAIInput> & Partial<AzureAIInput> & {
        configuration?: {
            organization?: string;
        };
    } & {
        appiumBaseUrl: string;
        appiumPort: number;
        iOSVersion: string;
        deviceUdid: string;
    });
    /**
     * Runs the agent to achieve a specified end goal using a series of actions.
     * @param query - The query to be achieved.
     * @returns A promise resolving to an array of relevant data strings upon successfully achieving the goal.
     */
    runAsync({ query }: {
        query: string;
    }): Promise<string[][]>;
    private runAppStepAsync;
    private initWdioAsync;
}
